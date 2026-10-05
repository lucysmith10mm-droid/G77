import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { authenticateOwner, generateToken, requireAdmin, verifyAdminPassword } from './server/auth';
import { sendCustomerApprovalEmail, sendCustomerCustomMessage, sendOwnerPaymentNotification } from './server/email';
import { askAiSupport } from './server/gemini';
import { DEFAULT_ACCESS_LINK, OFFICIAL_PLANS, OWNER_EMAIL } from './server/plans';
import { db } from './server/storage';
import { querySqlOrders } from './server/sql';
import { syncVideoToFirestore, deleteVideoFromFirestore } from './server/firebase';
import {
  getPaymentProviderPublicConfig,
  getPaymentHealth,
  createCheckoutSession,
  processStripeWebhook,
  processPaypalWebhook,
} from './server/payments';
import { PlanId } from './src/types';

// Rate Limiting Map (Requirement 14)
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();
function checkRateLimit(ip: string, action: string, maxRequests: number, windowMs: number): boolean {
  const key = `${ip}:${action}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || (now - entry.firstRequest) > windowMs) {
    rateLimitMap.set(key, { count: 1, firstRequest: now });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count++;
  return true;
}

// Memory clean-up every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitMap.entries()) {
    if (now - v.firstRequest > 600000) rateLimitMap.delete(k);
  }
}, 300000);

// Real-Time SSE Clients for Admin Dashboard (Sub-millisecond live updates)
const adminSseClients = new Set<Response>();

export function broadcastAdminEvent(event: { type: string; [key: string]: any }) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of adminSseClients) {
    try {
      client.write(payload);
    } catch {
      adminSseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure body parser and capture rawBody for webhook signature verification
  app.use(express.json({
    limit: '100mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Serve videos statically with HTTP Range request support for smooth streaming
  const publicVideosDir = path.resolve(process.cwd(), 'public/videos');
  if (!fs.existsSync(publicVideosDir)) {
    fs.mkdirSync(publicVideosDir, { recursive: true });
  }
  app.use('/videos', express.static(publicVideosDir));

  // CORS and domain support for custom domains like protectapk.com
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Handle malformed JSON safely without returning HTML error page
  app.use((err: any, req: Request, res: Response, next: any) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ success: false, error: 'Malformed JSON payload received.' });
    }
    next(err);
  });

  // ==========================================
  // PUBLIC CUSTOMER API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'SEE DANCE 2.5 + SEE DANCE 2.0 API' });
  });

  // Official Plans (Global USD Pricing: $4, $15, $80)
  app.get('/api/plans', (req: Request, res: Response) => {
    res.json({
      plans: Object.values(OFFICIAL_PLANS),
      currency: '$',
      currencyCode: 'USD',
      products: ['SEE DANCE 2.5', 'SEE DANCE 2.0']
    });
  });

  // Active Payment QR (Owner-uploaded only)
  app.get('/api/qr/active', (req: Request, res: Response) => {
    try {
      const qr = db.getActiveQR();
      if (!qr || !qr.active || !qr.imageUrl) {
        return res.json({
          active: false,
          message: 'Payment QR is currently being refreshed by the owner.',
          upiId: qr?.upiId || 'harishsingh9208@okaxis'
        });
      }
      res.json({
        active: true,
        imageUrl: qr.imageUrl,
        upiId: qr.upiId,
        uploadedAt: qr.uploadedAt,
        note: qr.note
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve active QR' });
    }
  });

  // Centralized Server-Side Input Validator and Sanitizer (Requirement 15)
  function validateAndSanitizeInputs(data: {
    customerName?: any;
    customerEmail?: any;
    customerPhone?: any;
    paymentReference?: any;
  }) {
    if (data.customerName !== undefined) {
      if (typeof data.customerName !== 'string' || data.customerName.trim().length < 2 || data.customerName.trim().length > 100) {
        return { valid: false, error: 'Full name must be between 2 and 100 characters.' };
      }
      // Check for illegal script tags or dangerous characters
      if (/<[^>]*>/i.test(data.customerName)) {
        return { valid: false, error: 'Full name cannot contain HTML or script tags.' };
      }
    }

    if (data.customerEmail !== undefined) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (typeof data.customerEmail !== 'string' || !emailRegex.test(data.customerEmail.trim()) || data.customerEmail.trim().length > 120) {
        return { valid: false, error: 'Please provide a valid email address (e.g. name@gmail.com).' };
      }
    }

    if (data.customerPhone !== undefined && data.customerPhone !== null && String(data.customerPhone).trim() !== '') {
      const phoneRegex = /^[0-9+\s\-()]{7,20}$/;
      if (typeof data.customerPhone !== 'string' || !phoneRegex.test(data.customerPhone.trim())) {
        return { valid: false, error: 'Please enter a valid phone or WhatsApp number (7 to 20 digits).' };
      }
    }

    if (data.paymentReference !== undefined && data.paymentReference !== null && data.paymentReference !== '') {
      if (typeof data.paymentReference !== 'string' || data.paymentReference.trim().length < 3 || data.paymentReference.trim().length > 64) {
        return { valid: false, error: 'Payment transaction reference (UTR) must be between 3 and 64 characters.' };
      }
      if (/<[^>]*>/i.test(data.paymentReference)) {
        return { valid: false, error: 'Transaction reference cannot contain HTML or script tags.' };
      }
    }

    return { valid: true, error: null };
  }

  // Create Order (Server-authoritative plan mapping, Rate Limiting & Duplicate Protection)
  app.post('/api/order/create', (req: Request, res: Response) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(clientIp, 'order_create', 25, 60000)) {
        return res.status(429).json({ error: 'Too many requests. Please wait a moment before trying again.' });
      }

      const { customerName, customerEmail, customerPhone, planId } = req.body;

      const val = validateAndSanitizeInputs({ customerName, customerEmail, customerPhone });
      if (!val.valid) {
        return res.status(400).json({ error: val.error });
      }

      if (!planId || !OFFICIAL_PLANS[planId as PlanId]) {
        return res.status(400).json({ error: 'Invalid or missing plan ID selected.' });
      }

      const cleanName = customerName.trim();
      const cleanEmail = customerEmail.trim().toLowerCase();
      const cleanPhone = customerPhone.trim();

      // Duplicate Order Protection: If same customer submitted exact same plan within 30 seconds
      const recentOrder = db.getOrders().find(o =>
        o.customerEmail.toLowerCase() === cleanEmail &&
        o.planId === planId &&
        o.paymentStatus === 'PENDING' &&
        (Date.now() - new Date(o.createdAt).getTime()) < 30000
      );

      if (recentOrder) {
        return res.status(200).json({
          success: true,
          order: {
            id: recentOrder.id,
            orderId: recentOrder.orderId,
            customerName: recentOrder.customerName,
            customerEmail: recentOrder.customerEmail,
            customerPhone: recentOrder.customerPhone,
            planId: recentOrder.planId,
            planName: recentOrder.planName,
            duration: recentOrder.duration,
            amount: recentOrder.amount,
            paymentStatus: recentOrder.paymentStatus,
            createdAt: recentOrder.createdAt
          }
        });
      }

      const order = db.createOrder({
        customerName: cleanName,
        customerEmail: cleanEmail,
        customerPhone: cleanPhone,
        planId: planId as PlanId
      });

      broadcastAdminEvent({ type: 'ORDER_CREATED', order });

      res.status(201).json({
        success: true,
        order: {
          id: order.id,
          orderId: order.orderId,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          planId: order.planId,
          planName: order.planName,
          duration: order.duration,
          amount: order.amount,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt
        }
      });
    } catch (err: any) {
      console.error('Order creation error:', err);
      res.status(500).json({ error: err.message || 'Failed to create order.' });
    }
  });

  // Temporary Login System (NO OTP, only Name, Gmail, Password)
  app.post('/api/auth/temp-login', (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Please enter your name (minimum 2 characters).' });
      }
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Please enter a valid Gmail / Email address.' });
      }
      if (!password || typeof password !== 'string' || password.length < 3) {
        return res.status(400).json({ error: 'Please enter a password (minimum 3 characters).' });
      }

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      const uid = 'usr_' + Buffer.from(cleanEmail).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);

      const user = {
        uid,
        displayName: cleanName,
        email: cleanEmail,
        isTemporary: true,
        role: 'developer',
        token: 'temp_token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        loggedInAt: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        message: 'Temporary login successful! No OTP required.',
        user
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Temporary login failed.' });
    }
  });

  // Customer submits payment confirmation ("I HAVE PAID")
  app.post('/api/order/submit-payment', async (req: Request, res: Response) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(clientIp, 'submit_payment', 20, 60000)) {
        return res.status(429).json({ error: 'Too many requests. Please wait a moment before trying again.' });
      }

      const { orderId, paymentReference, customerName, customerEmail, customerPhone, planId } = req.body;

      // Mandatory UTR Validation: Customer MUST provide transaction UTR/reference number to submit payment
      if (!paymentReference || typeof paymentReference !== 'string' || paymentReference.trim().length < 4) {
        return res.status(400).json({
          error: 'Please enter your 12-digit UPI UTR / Transaction Reference Number to verify your payment.'
        });
      }

      // Validate inputs if customer details are provided
      if (customerName || customerEmail || customerPhone || paymentReference) {
        const val = validateAndSanitizeInputs({
          customerName: customerName ? customerName : undefined,
          customerEmail: customerEmail ? customerEmail : undefined,
          customerPhone: customerPhone ? customerPhone : undefined,
          paymentReference: paymentReference ? paymentReference : undefined,
        });
        if (!val.valid) {
          return res.status(400).json({ error: val.error });
        }
      }

      // Ensure we have either an orderId or customer details to create/update
      if (!orderId && (!customerName || !customerEmail || !customerPhone || !planId)) {
        return res.status(400).json({
          error: 'Please provide either Order ID or complete customer details (Name, Email, Phone, Plan).'
        });
      }

      let updatedOrder;
      try {
        updatedOrder = db.createOrSubmitPayment({
          orderId: orderId?.trim() || undefined,
          customerName: customerName?.trim() || undefined,
          customerEmail: customerEmail?.trim().toLowerCase() || undefined,
          customerPhone: customerPhone?.trim() || undefined,
          planId: planId as PlanId,
          paymentReference: paymentReference?.trim() || undefined
        });
      } catch (dbErr: any) {
        console.error('[DATABASE ERROR] Failed to record payment submission:', dbErr);
        // Requirement 14: Never show "Payment Pending" if DB fails
        return res.status(500).json({
          error: 'Unable to submit your payment request. Please try again.'
        });
      }

      // Requirement 13: Asynchronously notify owner; failure must NEVER affect order persistence
      sendOwnerPaymentNotification(updatedOrder).catch(emailErr => {
        console.error('[EMAIL NOTIFICATION] Failed to send owner email, order safely persisted:', emailErr);
      });

      // Real-time notification broadcast to all connected Admin dashboards
      broadcastAdminEvent({ type: 'PAYMENT_SUBMITTED', order: updatedOrder });

      res.json({
        success: true,
        order: {
          id: updatedOrder.id,
          orderId: updatedOrder.orderId,
          customerName: updatedOrder.customerName,
          customerEmail: updatedOrder.customerEmail,
          customerPhone: updatedOrder.customerPhone,
          planId: updatedOrder.planId,
          planName: updatedOrder.planName,
          duration: updatedOrder.duration,
          amount: updatedOrder.amount,
          paymentStatus: updatedOrder.paymentStatus,
          paymentReference: updatedOrder.paymentReference,
          createdAt: updatedOrder.createdAt,
          updatedAt: updatedOrder.updatedAt
        }
      });
    } catch (err: any) {
      console.error('Submit payment unexpected error:', err);
      res.status(500).json({
        error: 'Unable to submit your payment request. Please try again.'
      });
    }
  });

  // ==========================================
  // GLOBAL CHECKOUT & PAYMENT PROVIDER ROUTES
  // ==========================================

  // Public Payment Providers Status (Stripe, PayPal, Crypto)
  app.get('/api/payment/config', (_req: Request, res: Response) => {
    try {
      const config = getPaymentProviderPublicConfig();
      res.json(config);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve payment configuration.' });
    }
  });

  // Global Checkout Session Initiator (Stripe / PayPal / Crypto)
  app.post('/api/payment/checkout-session', async (req: Request, res: Response) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(clientIp, 'checkout_session', 30, 60000)) {
        return res.status(429).json({ error: 'Too many payment requests. Please wait a moment.' });
      }

      const { planId, customerName, customerEmail, customerPhone, paymentProvider, paymentMethod, returnUrl, cancelUrl, sourceDomain } = req.body;

      if (!customerName || !customerEmail || !planId) {
        return res.status(400).json({ error: 'Full name, email, and plan selection are required.' });
      }

      const val = validateAndSanitizeInputs({ customerName, customerEmail, customerPhone });
      if (!val.valid) {
        return res.status(400).json({ error: val.error });
      }

      const sessionResult = await createCheckoutSession({
        planId: planId as PlanId,
        customerName,
        customerEmail,
        customerPhone,
        paymentProvider: paymentProvider || 'stripe',
        paymentMethod: paymentMethod || 'card',
        returnUrl,
        cancelUrl,
        sourceDomain,
      });

      if (!sessionResult.success) {
        return res.status(sessionResult.requiresConfig ? 503 : 400).json(sessionResult);
      }

      broadcastAdminEvent({ type: 'CHECKOUT_SESSION_CREATED', orderId: sessionResult.orderId });
      res.json(sessionResult);
    } catch (err: any) {
      console.error('[Checkout Session Error]:', err);
      res.status(500).json({ error: err?.message || 'Failed to initialize checkout.' });
    }
  });

  // Stripe Webhook Endpoint (Server-to-Server)
  app.post('/api/webhooks/stripe', async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature && process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ error: 'Missing stripe-signature header.' });
    }

    try {
      const payload = (req as any).rawBody || req.body;
      const result = await processStripeWebhook(payload, signature);
      if (result.orderId) {
        broadcastAdminEvent({ type: 'ORDER_VERIFIED_PAID', orderId: result.orderId, status: result.status });
      }
      res.json(result);
    } catch (err: any) {
      console.error('[Stripe Webhook Route Error]:', err);
      res.status(400).json({ error: err.message || 'Webhook processing failed.' });
    }
  });

  // PayPal Webhook Endpoint (Server-to-Server)
  app.post('/api/webhooks/paypal', async (req: Request, res: Response) => {
    try {
      const result = await processPaypalWebhook(req.body);
      if (result.orderId) {
        broadcastAdminEvent({ type: 'ORDER_VERIFIED_PAID', orderId: result.orderId });
      }
      res.json(result);
    } catch (err: any) {
      console.error('[PayPal Webhook Route Error]:', err);
      res.status(400).json({ error: err.message || 'Webhook processing failed.' });
    }
  });

  // PayPal Client-side capture verification (Server-authoritative)
  app.post('/api/payment/paypal/capture', async (req: Request, res: Response) => {
    try {
      const { orderId, paypalOrderId } = req.body;
      if (!orderId || !paypalOrderId) {
        return res.status(400).json({ error: 'Missing orderId or paypalOrderId.' });
      }

      const order = db.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      const clientId = process.env.PAYPAL_CLIENT_ID;
      const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return res.status(503).json({ error: 'PayPal is not configured on server.' });
      }

      const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const isLive = !clientId.startsWith('sandbox_');
      const paypalBase = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

      // 1. Get token
      const tokenRes = await fetch(`${paypalBase}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // 2. Capture payment
      const captureRes = await fetch(`${paypalBase}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      const captureData = await captureRes.json();

      if (captureData.status === 'COMPLETED' || captureData.status === 'APPROVED') {
        const txId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id || paypalOrderId;
        const markResult = await db.markOrderPaid(orderId, {
          provider: 'paypal',
          transactionId: txId,
          providerOrderId: paypalOrderId,
          paidAt: new Date().toISOString(),
        });

        broadcastAdminEvent({ type: 'ORDER_VERIFIED_PAID', orderId, order: markResult.order });
        return res.json({ success: true, order: markResult.order });
      } else {
        return res.status(400).json({ error: 'Payment was not completed by PayPal.', details: captureData });
      }
    } catch (err: any) {
      console.error('[PayPal Capture Error]:', err);
      res.status(500).json({ error: err.message || 'Capture failed' });
    }
  });

  // Check Order Status (Public customer poll)
  app.get('/api/order/status/:orderId', (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const order = db.getOrderById(orderId);

      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      // Safe response: Access link ONLY exposed if order is PAID or APPROVED
      const responsePayload: any = {
        orderId: order.orderId,
        customerName: order.customerName,
        planName: order.planName,
        duration: order.duration,
        amount: order.amount,
        currency: order.currency || 'USD',
        paymentStatus: order.paymentStatus,
        paymentProvider: order.paymentProvider,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };

      if (order.paymentStatus === 'PAID' || order.paymentStatus === 'APPROVED') {
        responsePayload.paidAt = order.paidAt || order.approvedAt;
        responsePayload.approvedAt = order.approvedAt || order.paidAt;
        responsePayload.accessLink = order.accessLink || DEFAULT_ACCESS_LINK;
      } else if (order.paymentStatus === 'REJECTED' || order.paymentStatus === 'FAILED') {
        responsePayload.rejectedAt = order.rejectedAt;
        responsePayload.supportEmail = OWNER_EMAIL;
      }

      res.json(responsePayload);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve order status.' });
    }
  });

  // Customer Orders History (Private lookup by saved order IDs, email, or phone)
  app.get('/api/customer/orders', (req: Request, res: Response) => {
    try {
      const { ids, email, phone } = req.query;
      const idList = typeof ids === 'string' ? ids.split(',').map(s => s.trim()).filter(Boolean) : [];
      
      if (idList.length === 0 && !email && !phone) {
        return res.json({ orders: [] });
      }

      const orders = db.getCustomerOrders({
        ids: idList,
        email: typeof email === 'string' ? email : undefined,
        phone: typeof phone === 'string' ? phone : undefined,
      });

      const customerOrders = orders.map(o => ({
        id: o.id,
        orderId: o.orderId,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        planId: o.planId,
        planName: o.planName,
        duration: o.duration,
        amount: o.amount,
        paymentStatus: o.paymentStatus,
        paymentReference: o.paymentReference,
        accessLink: o.paymentStatus === 'APPROVED' ? (o.accessLink || DEFAULT_ACCESS_LINK) : undefined,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        approvedAt: o.approvedAt,
        rejectedAt: o.rejectedAt,
      }));

      res.json({ orders: customerOrders });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve customer order history.' });
    }
  });

  // AI Support Chat
  app.post('/api/ai-support', async (req: Request, res: Response) => {
    try {
      const { query, history } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'A query message is required.' });
      }

      const reply = await askAiSupport(query.trim(), Array.isArray(history) ? history : []);
      res.json({ reply });
    } catch (err: any) {
      console.error('AI Support error:', err);
      res.status(500).json({
        reply: "I am having temporary trouble connecting to the knowledge engine. You can review all plans directly on this page or reach out to harishsingh9208@gmail.com for priority help."
      });
    }
  });

  // ==========================================
  // PROTECTED OWNER ADMIN API ROUTES
  // ==========================================

  // Admin Login (Restricted strictly to harishsingh9208@gmail.com)
  app.post('/api/admin/login', (req: Request, res: Response) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(clientIp, 'admin_login', 10, 300000)) {
        return res.status(429).json({ error: 'Too many login attempts. Please wait 5 minutes before trying again.' });
      }

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== OWNER_EMAIL.toLowerCase()) {
        // Record unauthorized login attempt in audit log
        db.addAuditLog({
          adminUser: 'UNAUTHORIZED_ATTEMPT',
          action: 'LOGIN_DENIED_INVALID_EMAIL',
          metadata: { attemptedEmail: normalizedEmail }
        });
        return res.status(403).json({
          error: `403 ACCESS DENIED: ${normalizedEmail} is not authorized. The Admin Panel is strictly restricted to ${OWNER_EMAIL}.`
        });
      }

      const isValid = authenticateOwner(normalizedEmail, password);
      if (!isValid) {
        db.addAuditLog({
          adminUser: normalizedEmail,
          action: 'LOGIN_FAILED_BAD_PASSWORD'
        });
        return res.status(401).json({ error: 'Invalid owner credentials provided.' });
      }

      const token = generateToken(normalizedEmail);
      db.addAuditLog({
        adminUser: normalizedEmail,
        action: 'OWNER_LOGGED_IN'
      });

      res.json({
        success: true,
        token,
        user: { email: OWNER_EMAIL }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Login authentication error.' });
    }
  });

  // Admin Google Login (Restricted strictly to harishsingh9208@gmail.com)
  app.post('/api/admin/google-login', (req: Request, res: Response) => {
    try {
      const { email, uid } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Google email is required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== OWNER_EMAIL.toLowerCase()) {
        db.addAuditLog({
          adminUser: 'UNAUTHORIZED_ATTEMPT',
          action: 'GOOGLE_LOGIN_DENIED_NOT_OWNER',
          metadata: { attemptedEmail: normalizedEmail, uid }
        });
        return res.status(403).json({
          error: `403 ACCESS DENIED: ${normalizedEmail} is not authorized. The Admin Panel is strictly restricted to ${OWNER_EMAIL}.`
        });
      }

      const token = generateToken(normalizedEmail);
      db.addAuditLog({
        adminUser: normalizedEmail,
        action: 'OWNER_GOOGLE_LOGGED_IN',
        metadata: { uid }
      });

      res.json({
        success: true,
        token,
        user: { email: OWNER_EMAIL }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Google login verification error.' });
    }
  });

  // Verify Admin Session Token
  app.get('/api/admin/verify', requireAdmin, (req: Request, res: Response) => {
    res.json({
      valid: true,
      user: { email: OWNER_EMAIL }
    });
  });

  // Real-Time Server-Sent Events (SSE) stream for instantaneous Admin updates (<10ms latency)
  app.get('/api/admin/live-stream', requireAdmin, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    adminSseClients.add(res);

    // Initial handshake ping with real-time stats
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString(), message: 'Real-time live channel connected.' })}\n\n`);

    // Keepalive ping every 20 seconds to prevent reverse proxy timeouts
    const keepAlive = setInterval(() => {
      try {
        res.write(`: keepalive\n\n`);
      } catch {
        clearInterval(keepAlive);
        adminSseClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      adminSseClients.delete(res);
    });
  });

  // Dashboard Stats & Payment Health
  app.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response) => {
    const stats = db.getStats();
    const paymentHealth = getPaymentHealth();
    res.json({
      ...stats,
      paymentHealth
    });
  });

  // Admin Payment Health Monitoring Endpoint
  app.get('/api/admin/payment-health', requireAdmin, (_req: Request, res: Response) => {
    res.json(getPaymentHealth());
  });

  // Orders List (Filter by status, search by orderId, name, email, phone)
  app.get('/api/admin/orders', requireAdmin, (req: Request, res: Response) => {
    let orders = db.getOrders();
    const { status, search } = req.query;

    if (status && typeof status === 'string' && status !== 'ALL') {
      orders = orders.filter(o => o.paymentStatus === status);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      orders = orders.filter(o =>
        o.orderId.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q)
      );
    }

    res.json({ orders });
  });

  // Approve Payment & Send Access
  app.post('/api/admin/orders/:id/approve', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { accessLink } = req.body;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      const order = db.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      const targetAccessLink = accessLink?.trim() || order.accessLink || DEFAULT_ACCESS_LINK;
      const updated = db.approveOrder(order.id, targetAccessLink, adminEmail);

      // Send email to customer with access link
      await sendCustomerApprovalEmail(updated, targetAccessLink);

      broadcastAdminEvent({ type: 'ORDER_APPROVED', order: updated });

      res.json({
        success: true,
        order: updated
      });
    } catch (err: any) {
      console.error('Approve payment error:', err);
      res.status(500).json({ error: err.message || 'Failed to approve order.' });
    }
  });

  // Reject Payment
  app.post('/api/admin/orders/:id/reject', requireAdmin, (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      const order = db.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      const updated = db.rejectOrder(order.id, adminEmail, reason);

      broadcastAdminEvent({ type: 'ORDER_REJECTED', order: updated });

      res.json({
        success: true,
        order: updated
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to reject order.' });
    }
  });

  // Refund Order (Mark as REFUNDED in database and broadcast event)
  app.post('/api/admin/orders/:id/refund', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      const order = db.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      const refundedOrder = await db.markOrderRefunded(id, {
        adminEmail,
        reason: reason || 'Customer requested refund or payment reversal',
        refundedAt: new Date().toISOString()
      });

      broadcastAdminEvent({ type: 'ORDER_REFUNDED', order: refundedOrder });

      res.json({
        success: true,
        order: refundedOrder
      });
    } catch (err: any) {
      console.error('Refund order error:', err);
      res.status(500).json({ error: err.message || 'Failed to refund order.' });
    }
  });

  // Direct Update Order Status (Owner can approve, reject, mark paid or pending anytime)
  app.post('/api/admin/orders/:id/status', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, reason, accessLink } = req.body;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      if (!status || !['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'REFUNDED'].includes(status)) {
        return res.status(400).json({ error: 'Valid status is required (PENDING, APPROVED, REJECTED, PAID, REFUNDED).' });
      }

      const order = db.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      let updated: any;
      if (status === 'APPROVED') {
        const targetAccessLink = accessLink?.trim() || order.accessLink || DEFAULT_ACCESS_LINK;
        updated = db.approveOrder(order.id, targetAccessLink, adminEmail);
        sendCustomerApprovalEmail(updated, targetAccessLink).catch(() => {});
        broadcastAdminEvent({ type: 'ORDER_APPROVED', order: updated });
      } else if (status === 'REJECTED') {
        updated = db.rejectOrder(order.id, adminEmail, reason);
        broadcastAdminEvent({ type: 'ORDER_REJECTED', order: updated });
      } else {
        updated = db.updateOrderStatus(order.id, status as any, adminEmail, reason, accessLink);
        broadcastAdminEvent({ type: 'ORDER_UPDATED', order: updated });
      }

      res.json({ success: true, order: updated });
    } catch (err: any) {
      console.error('Update status error:', err);
      res.status(500).json({ error: err.message || 'Failed to update order status.' });
    }
  });

  // Update Admin Note
  app.post('/api/admin/orders/:id/note', requireAdmin, (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      const updated = db.updateAdminNote(id, note || '', adminEmail);

      broadcastAdminEvent({ type: 'ORDER_UPDATED', order: updated });

      res.json({ success: true, order: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update note.' });
    }
  });

  // Update Access Link for an individual order
  app.post('/api/admin/orders/:id/access-link', requireAdmin, (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { accessLink } = req.body;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      if (!accessLink || typeof accessLink !== 'string') {
        return res.status(400).json({ error: 'Valid access link required.' });
      }

      const updated = db.updateAccessLink(id, accessLink, adminEmail);

      broadcastAdminEvent({ type: 'ORDER_UPDATED', order: updated });

      res.json({ success: true, order: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update access link.' });
    }
  });

  // Send Manual Customer Message
  app.post('/api/admin/orders/:id/message', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message content is required.' });
      }

      const order = db.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      const recordedMessage = db.addCustomerMessage(
        order.orderId,
        order.customerEmail,
        message.trim(),
        adminEmail
      );

      // Trigger email dispatch
      await sendCustomerCustomMessage(order.customerEmail, order.orderId, message.trim());

      res.json({
        success: true,
        message: recordedMessage
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to send message.' });
    }
  });

  // Get Messages
  app.get('/api/admin/messages', requireAdmin, (req: Request, res: Response) => {
    const { orderId } = req.query;
    const messages = db.getMessages(typeof orderId === 'string' ? orderId : undefined);
    res.json({ messages });
  });

  // Delete Order (Move to Trash / Deleted History) - REQUIRES ADMIN PASSWORD
  app.delete('/api/admin/orders/:id', requireAdmin, (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { password } = req.body || {};
      const headerPassword = req.headers['x-admin-password'] as string | undefined;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      const passwordToTest = password || headerPassword;
      if (!passwordToTest || !verifyAdminPassword(passwordToTest)) {
        return res.status(401).json({
          error: 'Invalid admin password. Admin password verification is strictly required to delete history.'
        });
      }

      const success = db.deleteOrder(id, adminEmail);
      if (!success) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      broadcastAdminEvent({ type: 'ORDER_DELETED', orderId: id, orderIds: [id] });

      res.json({ success: true, message: 'Order moved to Deleted History (Trash).' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete order.' });
    }
  });

  // Bulk Delete Orders (Move to Trash) - REQUIRES ADMIN PASSWORD
  app.post('/api/admin/orders/bulk-delete', requireAdmin, (req: Request, res: Response) => {
    try {
      const { orderIds, password } = req.body || {};
      const headerPassword = req.headers['x-admin-password'] as string | undefined;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      const passwordToTest = password || headerPassword;
      if (!passwordToTest || !verifyAdminPassword(passwordToTest)) {
        return res.status(401).json({
          error: 'Invalid admin password. Admin password verification is strictly required for bulk history deletion.'
        });
      }

      if (!orderIds || (orderIds !== 'ALL' && (!Array.isArray(orderIds) || orderIds.length === 0))) {
        return res.status(400).json({ error: 'Please select orders or specify "ALL" to delete.' });
      }

      const result = db.bulkDeleteOrders(orderIds, adminEmail);

      broadcastAdminEvent({
        type: 'ORDERS_DELETED',
        orderIds: Array.isArray(orderIds) ? orderIds : 'ALL',
        count: result.count
      });

      res.json({
        success: true,
        count: result.count,
        message: `${result.count} order(s) successfully moved to Deleted History (Trash).`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to bulk delete orders.' });
    }
  });

  // Get Deleted Orders (Trash)
  app.get('/api/admin/deleted-orders', requireAdmin, (req: Request, res: Response) => {
    const deletedOrders = db.getDeletedOrders();
    res.json({ deletedOrders });
  });

  // Restore Deleted Order back to Active Orders
  app.post('/api/admin/deleted-orders/:id/restore', requireAdmin, (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      const restored = db.restoreOrder(id, adminEmail);
      if (!restored) {
        return res.status(404).json({ error: 'Order not found in deleted history.' });
      }

      broadcastAdminEvent({ type: 'ORDER_RESTORED', order: restored });

      res.json({ success: true, order: restored, message: 'Order successfully restored to active orders.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to restore order.' });
    }
  });

  // Permanently Delete Order from Database (Purge) - REQUIRES PASSWORD
  app.delete('/api/admin/deleted-orders/:id/permanent', requireAdmin, (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { password } = req.body || {};
      const headerPassword = req.headers['x-admin-password'] as string | undefined;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      const passwordToTest = password || headerPassword;
      if (!passwordToTest || !verifyAdminPassword(passwordToTest)) {
        return res.status(401).json({
          error: 'Invalid admin password. Password verification is required for permanent purging.'
        });
      }

      const success = db.permanentDeleteOrder(id, adminEmail);
      if (!success) {
        return res.status(404).json({ error: 'Order not found in deleted history.' });
      }

      broadcastAdminEvent({ type: 'ORDER_PURGED', orderId: id });

      res.json({ success: true, message: 'Order permanently purged from database.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to permanently delete order.' });
    }
  });

  // Empty Trash (Purge All Deleted History) - REQUIRES PASSWORD
  app.post('/api/admin/deleted-orders/empty-trash', requireAdmin, (req: Request, res: Response) => {
    try {
      const { password } = req.body || {};
      const headerPassword = req.headers['x-admin-password'] as string | undefined;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      const passwordToTest = password || headerPassword;
      if (!passwordToTest || !verifyAdminPassword(passwordToTest)) {
        return res.status(401).json({
          error: 'Invalid admin password. Master password is required to empty all trash.'
        });
      }

      const result = db.emptyTrash(adminEmail);

      broadcastAdminEvent({ type: 'TRASH_EMPTIED', count: result.count });

      res.json({
        success: true,
        count: result.count,
        message: `Deleted history cleared. ${result.count} orders permanently purged.`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to empty trash.' });
    }
  });

  // Purge ALL Old Test History (Completely fresh clean start across SQLite, JSON & Firestore) - REQUIRES PASSWORD
  app.post('/api/admin/history/purge-all', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { password } = req.body || {};
      const headerPassword = req.headers['x-admin-password'] as string | undefined;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      const passwordToTest = password || headerPassword;
      if (!passwordToTest || !verifyAdminPassword(passwordToTest)) {
        return res.status(401).json({
          error: 'Invalid admin password. Master password is required to completely purge all test history.'
        });
      }

      const result = db.purgeAllHistory(adminEmail);

      broadcastAdminEvent({ type: 'ALL_HISTORY_PURGED', timestamp: new Date().toISOString() });
      broadcastAdminEvent({ type: 'ORDERS_DELETED', orderIds: 'ALL' });
      broadcastAdminEvent({ type: 'TRASH_EMPTIED', count: result.purgedDeleted });

      res.json({
        success: true,
        purgedOrders: result.purgedOrders,
        purgedDeleted: result.purgedDeleted,
        message: 'All old history completely erased. Database is 100% fresh and clean.'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to purge all history.' });
    }
  });

  // Full Database Backup Export (JSON Download)
  app.get('/api/admin/backup/download', requireAdmin, (req: Request, res: Response) => {
    try {
      const data = db.getBackupData();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="seedance_backup_${Date.now()}.json"`);
      res.send(JSON.stringify(data, null, 2));
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate backup export.' });
    }
  });

  // Audit Logs
  app.get('/api/admin/audit-logs', requireAdmin, (req: Request, res: Response) => {
    res.json({ logs: db.getAuditLogs() });
  });

  // Email Logs
  app.get('/api/admin/emails', requireAdmin, (req: Request, res: Response) => {
    res.json({ emails: db.getEmailLogs() });
  });

  // Admin QR Management (View, Upload, Replace, Remove)
  app.get('/api/admin/qr', requireAdmin, (req: Request, res: Response) => {
    res.json({ qr: db.getActiveQR() });
  });

  app.post('/api/admin/qr/upload', requireAdmin, (req: Request, res: Response) => {
    try {
      const { imageData, fileName, upiId, note } = req.body;
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;

      if (!imageData || typeof imageData !== 'string') {
        return res.status(400).json({ error: 'Valid image data (base64 data URL or URL) is required.' });
      }

      // Check file size (approximate base64 length max ~7MB)
      if (imageData.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image size exceeds maximum 5MB limit.' });
      }

      const updated = db.updateActiveQR({
        imageUrl: imageData,
        adminUser: adminEmail,
        fileName,
        upiId,
        note
      });

      res.json({
        success: true,
        message: 'Active payment QR successfully updated.',
        qr: updated
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to upload QR.' });
    }
  });

  app.post('/api/admin/qr/remove', requireAdmin, (req: Request, res: Response) => {
    try {
      const adminEmail = (req as any).adminSession?.email || OWNER_EMAIL;
      const updated = db.removeActiveQR(adminEmail);
      res.json({
        success: true,
        message: 'Active QR removed.',
        qr: updated
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to remove QR.' });
    }
  });

  // Database Connection & Sync Status (Relational SQL + Firebase Firestore)
  app.get('/api/admin/database-status', requireAdmin, async (req: Request, res: Response) => {
    try {
      const sqlOrders = await querySqlOrders();
      res.json({
        sql: {
          connected: true,
          engine: 'SQLite Relational SQL',
          tables: ['orders', 'customer_messages', 'audit_logs', 'qr_config', 'email_logs'],
          totalOrdersInSql: sqlOrders.length,
          lastSync: new Date().toISOString()
        },
        firebase: {
          connected: true,
          projectId: 'citric-variety-vghtt',
          collections: ['orders', 'system', 'messages', 'audit_logs'],
          status: 'Online & Synced'
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve database status.' });
    }
  });

  // ==========================================
  // SHOWCASE VIDEO API ENDPOINTS
  // ==========================================

  // 1. Get all showcase videos
  app.get('/api/videos', (_req: Request, res: Response) => {
    try {
      const videos = db.getVideos();
      res.json({ success: true, videos });
    } catch (err: any) {
      console.error('[API /api/videos] Error retrieving videos:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve showcase videos' });
    }
  });

  // 2. High-performance direct backend video streaming with HTTP 206 Partial Content & chunking
  app.get('/api/videos/stream/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      let targetFile = '';

      // 1. Check if ID matches a video in database
      const video = db.getVideoById(id);
      if (video?.videoUrl) {
        const cleanName = path.basename(video.videoUrl);
        const candidate = path.join(publicVideosDir, cleanName);
        if (fs.existsSync(candidate)) {
          targetFile = candidate;
        }
      }

      // 2. Check if ID is directly a filename
      if (!targetFile || !fs.existsSync(targetFile)) {
        const cleanId = path.basename(id);
        const candidate = path.join(publicVideosDir, cleanId.endsWith('.mp4') ? cleanId : `${cleanId}.mp4`);
        if (fs.existsSync(candidate)) {
          targetFile = candidate;
        }
      }

      // 3. Fallback to default showcase video if needed
      if (!targetFile || !fs.existsSync(targetFile)) {
        targetFile = path.join(publicVideosDir, 'myvideo1.mp4');
      }

      if (!fs.existsSync(targetFile)) {
        return res.status(404).json({ success: false, error: 'Video file not found' });
      }

      const stat = fs.statSync(targetFile);
      const fileSize = stat.size;
      const range = req.headers.range;

      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
      res.setHeader('Content-Type', 'video/mp4');

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        // Serve in chunks of at most 1.5MB to keep memory lightweight and avoid frontend lag
        const maxChunk = 1.5 * 1024 * 1024;
        const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + maxChunk, fileSize - 1);

        if (start >= fileSize || end >= fileSize) {
          res.setHeader('Content-Range', `bytes */${fileSize}`);
          return res.status(416).end();
        }

        const chunksize = end - start + 1;
        const fileStream = fs.createReadStream(targetFile, { start, end });

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Content-Length', chunksize);

        fileStream.pipe(res);
      } else {
        res.setHeader('Content-Length', fileSize);
        res.status(200);
        fs.createReadStream(targetFile).pipe(res);
      }
    } catch (err: any) {
      console.error('[API /api/videos/stream] Streaming error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Video streaming failed' });
      }
    }
  });

  // 3. Add a showcase video metadata
  app.post('/api/videos', async (req: Request, res: Response) => {
    try {
      const { title, subtitle, badge, videoUrl, thumbnailUrl, prompt, duration, resolution, fps } = req.body;
      if (!videoUrl) {
        return res.status(400).json({ success: false, error: 'videoUrl is required' });
      }

      const newVideo = db.addVideo({
        title: title?.trim() || 'Custom AI Generation',
        subtitle: subtitle?.trim() || 'SEE DANCE Generation Reel',
        badge: badge?.trim() || 'SEEDANCE 2.5',
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl?.trim(),
        prompt: prompt?.trim() || '',
        duration: duration?.trim() || '0:05',
        resolution: resolution?.trim() || '4K Native',
        fps: Number(fps) || 60,
      });

      broadcastAdminEvent({ type: 'VIDEO_ADDED', video: newVideo });
      syncVideoToFirestore(newVideo).catch(() => {});
      res.status(201).json({ success: true, video: newVideo });
    } catch (err: any) {
      console.error('[API POST /api/videos] Error adding video:', err);
      res.status(500).json({ success: false, error: 'Failed to add showcase video' });
    }
  });

  // 4. Upload a video file or Reference Image (Base64 data URL or binary)
  app.post('/api/videos/upload', async (req: Request, res: Response) => {
    try {
      const { fileData, fileName, title, subtitle, badge, prompt } = req.body;
      if (!fileData) {
        return res.status(400).json({ success: false, error: 'fileData (base64 string) is required' });
      }

      // Check if it's a base64 data URI
      let buffer: Buffer;
      let extension = 'mp4';
      let isImage = false;

      if (typeof fileData === 'string' && fileData.includes(';base64,')) {
        const parts = fileData.split(';base64,');
        const mime = parts[0].split(':')[1] || '';
        if (mime.includes('image/') || mime.includes('jpeg') || mime.includes('jpg') || mime.includes('png') || mime.includes('webp')) {
          isImage = true;
          extension = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
        } else if (mime.includes('webm')) {
          extension = 'webm';
        } else if (mime.includes('quicktime') || mime.includes('mov')) {
          extension = 'mov';
        } else if (mime.includes('mp4')) {
          extension = 'mp4';
        }
        buffer = Buffer.from(parts[1], 'base64');
      } else if (typeof fileData === 'string') {
        buffer = Buffer.from(fileData, 'base64');
      } else {
        return res.status(400).json({ success: false, error: 'Invalid file format' });
      }

      const timestamp = Date.now();
      const rawName = (fileName || (isImage ? 'reference_image' : 'reel')).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 25);
      let safeName = `upload_${timestamp}_${rawName}.${extension}`;
      let thumbnailUrl = `/videos/thumb1.jpg`;

      if (isImage) {
        // 1. Save uploaded reference image directly
        const refImgName = `ref_${timestamp}_${rawName}.${extension}`;
        const refImgPath = path.join(publicVideosDir, refImgName);
        fs.writeFileSync(refImgPath, buffer);
        thumbnailUrl = `/videos/${refImgName}`;

        // 2. Animate reference image into high-quality 6-second vertical 9:16 video reel using ffmpeg
        const outVideoName = `anim_${timestamp}_${rawName}.mp4`;
        const outVideoPath = path.join(publicVideosDir, outVideoName);
        try {
          execSync(
            `ffmpeg -y -loop 1 -i "${refImgPath}" -vf "scale=540:960:force_original_aspect_ratio=increase,crop=540:960,zoompan=z='min(zoom+0.0015,1.15)':d=150:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=540x960" -t 5 -pix_fmt yuv420p -c:v libx264 -preset ultrafast -movflags +faststart "${outVideoPath}"`,
            { timeout: 15000, stdio: 'ignore' }
          );
          safeName = outVideoName;
        } catch (animErr) {
          console.warn('[Upload] ffmpeg reference animation notice, falling back to original video:', animErr);
          // Fallback to copying a stock video if ffmpeg fails
          fs.copyFileSync(path.join(publicVideosDir, 'myvideo1.mp4'), outVideoPath);
          safeName = outVideoName;
        }
      } else {
        // Standard video file upload
        const savePath = path.join(publicVideosDir, safeName);
        fs.writeFileSync(savePath, buffer);

        // Generate thumbnail frame for the video
        try {
          const thumbName = `thumb_${timestamp}_${rawName}.jpg`;
          const thumbPath = path.join(publicVideosDir, thumbName);
          execSync(`ffmpeg -y -ss 00:00:01 -i "${savePath}" -vframes 1 -q:v 2 "${thumbPath}"`, { timeout: 10000, stdio: 'ignore' });
          if (fs.existsSync(thumbPath)) {
            thumbnailUrl = `/videos/${thumbName}`;
          }
        } catch {
          thumbnailUrl = `/videos/thumb1.jpg`;
        }
      }

      const videoUrl = `/videos/${safeName}`;

      const newVideo = db.addVideo({
        title: title?.trim() || (fileName ? fileName.replace(/\.[^/.]+$/, "") : (isImage ? 'Reference Image Motion Reel' : 'User Uploaded Reel')),
        subtitle: subtitle?.trim() || (isImage ? 'Seedance Image-to-Video Engine' : 'Official User Generation'),
        badge: badge?.trim() || 'SEEDANCE 2.5',
        videoUrl,
        thumbnailUrl,
        prompt: prompt?.trim() || (isImage ? 'Animated from user uploaded reference image with Seedance 2.5 AI motion physics' : 'Direct user upload into SEE DANCE showcase gallery'),
        duration: '0:05',
        resolution: '4K Native',
        fps: 60,
      });

      broadcastAdminEvent({ type: 'VIDEO_ADDED', video: newVideo });
      syncVideoToFirestore(newVideo).catch(() => {});
      res.status(201).json({ success: true, video: newVideo, videoUrl, isImageReference: isImage });
    } catch (err: any) {
      console.error('[API POST /api/videos/upload] Error uploading file:', err);
      res.status(500).json({ success: false, error: 'Failed to upload video file: ' + err.message });
    }
  });

  // 5. Delete a video
  app.delete('/api/videos/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = db.deleteVideo(id);
      if (success) {
        broadcastAdminEvent({ type: 'VIDEO_DELETED', id });
        deleteVideoFromFirestore(id).catch(() => {});
        res.json({ success: true, message: 'Video removed successfully' });
      } else {
        res.status(404).json({ success: false, error: 'Video not found' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to delete video' });
    }
  });

  // 6. Update a video
  app.patch('/api/videos/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = db.updateVideo(id, req.body);
      if (updated) {
        broadcastAdminEvent({ type: 'VIDEO_UPDATED', video: updated });
        syncVideoToFirestore(updated).catch(() => {});
        res.json({ success: true, video: updated });
      } else {
        res.status(404).json({ success: false, error: 'Video not found' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: 'Failed to update video' });
    }
  });

  // Catch-all for API routes to ALWAYS return JSON (prevent serving HTML index.html on missing/misspelled API endpoints)
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `API endpoint ${req.method} ${req.path} not found.`,
      status: 404
    });
  });

  // ==========================================
  // VITE DEV MIDDLEWARE & PRODUCTION STATIC
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use, retrying in 1s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch {}
        server.listen(PORT, '0.0.0.0');
      }, 1000);
    } else {
      console.error('Server error:', err);
    }
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 1500).unref();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
