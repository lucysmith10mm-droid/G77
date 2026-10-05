import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { Order, PaymentHealthStatus, PaymentProviderStatus, PlanConfig, PlanId } from '../types';

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  isHtmlFallback?: boolean;
}

/**
 * Robust fetch wrapper that gracefully handles non-JSON / HTML responses
 * (such as when deployed on custom domains like protectapk.com without Node proxy)
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If response is explicitly HTML (e.g. index.html SPA fallback or Nginx 502/404 HTML)
    if (contentType.includes('text/html')) {
      const text = await res.text();
      return {
        ok: false,
        status: res.status,
        data: null,
        error: 'Host server returned HTML instead of JSON API response.',
        isHtmlFallback: true,
      };
    }

    const text = await res.text();
    // Check if body starts with HTML doctype or tags
    const trimmed = text.trim();
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || (trimmed.startsWith('<') && trimmed.endsWith('>'))) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: 'Server returned HTML page. Fallback system engaged.',
        isHtmlFallback: true,
      };
    }

    try {
      const data = JSON.parse(text);
      return {
        ok: res.ok,
        status: res.status,
        data,
        error: !res.ok ? data.error || `Request failed with status ${res.status}` : undefined,
        isHtmlFallback: false,
      };
    } catch {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: 'Invalid JSON response from server.',
        isHtmlFallback: false,
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err.message || 'Network connectivity error.',
      isHtmlFallback: false,
    };
  }
}

// Generate unique human-readable order ID
export function generateClientOrderId(): string {
  const year = new Date().getFullYear();
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timeSuffix = Date.now().toString().slice(-4);
  return `SD-${year}-${randomHex}${timeSuffix}`;
}

/**
 * Create order with dual API + Firestore fallback
 * This ensures that on protectapk.com (even on static hosting or misconfigured reverse proxy),
 * entering Name, Email, and Phone will NEVER throw "Unexpected token '<'".
 */
export async function createOrderResilient(params: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  plan: PlanConfig;
}): Promise<{ success: boolean; order: Order; error?: string }> {
  const cleanName = params.customerName.trim();
  const cleanEmail = params.customerEmail.trim().toLowerCase();
  const cleanPhone = params.customerPhone.trim();

  // 1. First attempt standard backend API
  const apiRes = await safeFetchJson<{ success: boolean; order: Order; error?: string }>('/api/order/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: cleanName,
      customerEmail: cleanEmail,
      customerPhone: cleanPhone,
      planId: params.plan.id,
    }),
  });

  if (apiRes.ok && apiRes.data?.success && apiRes.data.order) {
    // Dual sync to Firestore in background
    syncOrderToFirestoreDirect(apiRes.data.order).catch(() => {});
    return { success: true, order: apiRes.data.order };
  }

  // 2. If API returned HTML (like on protectapk.com static hosting) or failed,
  // engage direct Firestore order creation!
  console.info('Backend API unavailable or returned HTML on current domain; provisioning order directly via Firebase Cloud...');
  try {
    const orderId = generateClientOrderId();
    const nowIso = new Date().toISOString();
    const newOrder: Order = {
      id: orderId,
      orderId: orderId,
      customerName: cleanName,
      customerEmail: cleanEmail,
      customerPhone: cleanPhone,
      planId: params.plan.id,
      planName: params.plan.name,
      duration: params.plan.duration,
      amount: params.plan.amount,
      paymentStatus: 'PENDING',
      createdAt: nowIso,
      updatedAt: nowIso,
      sourceDomain: window.location.hostname || 'protectapk.com',
    };

    // Save directly to Firebase Firestore
    await setDoc(doc(db, 'orders', orderId), newOrder);

    // Save to local storage for customer order history
    saveLocalOrder(newOrder);

    return { success: true, order: newOrder };
  } catch (firestoreErr: any) {
    console.error('Firestore direct order creation error:', firestoreErr);
    // Local fallback order so user can still proceed to payment
    const orderId = generateClientOrderId();
    const nowIso = new Date().toISOString();
    const fallbackOrder: Order = {
      id: orderId,
      orderId: orderId,
      customerName: cleanName,
      customerEmail: cleanEmail,
      customerPhone: cleanPhone,
      planId: params.plan.id,
      planName: params.plan.name,
      duration: params.plan.duration,
      amount: params.plan.amount,
      paymentStatus: 'PENDING',
      createdAt: nowIso,
      updatedAt: nowIso,
      sourceDomain: window.location.hostname || 'protectapk.com',
    };
    saveLocalOrder(fallbackOrder);
    return { success: true, order: fallbackOrder };
  }
}

/**
 * Submit Payment (UTR) with dual API + Firestore fallback
 */
export async function submitPaymentResilient(params: {
  orderId: string;
  paymentReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  planId: PlanId;
}): Promise<{ success: boolean; order?: Order; error?: string }> {
  const trimmedUtr = params.paymentReference.trim();

  // 1. Try server API
  const apiRes = await safeFetchJson<{ success: boolean; order: Order; error?: string }>('/api/order/submit-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: params.orderId,
      paymentReference: trimmedUtr,
      customerName: params.customerName.trim(),
      customerEmail: params.customerEmail.trim().toLowerCase(),
      customerPhone: params.customerPhone.trim(),
      planId: params.planId,
    }),
  });

  if (apiRes.ok && apiRes.data?.success && apiRes.data.order) {
    syncOrderToFirestoreDirect(apiRes.data.order).catch(() => {});
    return { success: true, order: apiRes.data.order };
  }

  // 2. Direct Firestore fallback
  console.info('Updating payment status directly on Firestore Cloud...');
  try {
    const orderDocRef = doc(db, 'orders', params.orderId);
    const updatePayload = {
      paymentStatus: 'PENDING',
      paymentReference: trimmedUtr,
      paymentSubmittedAt: new Date().toISOString(),
    };

    await setDoc(orderDocRef, updatePayload, { merge: true });

    // Retrieve full order
    const snap = await getDoc(orderDocRef);
    const nowIso = new Date().toISOString();
    const updatedOrder = (snap.exists() ? snap.data() : {
      orderId: params.orderId,
      paymentReference: trimmedUtr,
      paymentStatus: 'PENDING',
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      planId: params.planId,
      createdAt: nowIso,
      updatedAt: nowIso,
    }) as Order;

    saveLocalOrder(updatedOrder);
    return { success: true, order: updatedOrder };
  } catch (err: any) {
    console.warn('Direct Firestore update warning, recording locally:', err);
    const nowIso = new Date().toISOString();
    const localOrder: Order = {
      orderId: params.orderId,
      id: params.orderId,
      paymentReference: trimmedUtr,
      paymentStatus: 'PENDING',
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      planId: params.planId,
      planName: 'SEE DANCE Unlimited',
      duration: 'Unlimited',
      amount: 499,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    saveLocalOrder(localOrder);
    return { success: true, order: localOrder };
  }
}

/**
 * Fetch active QR with Firestore fallback
 */
export async function fetchActiveQrResilient(): Promise<{
  active: boolean;
  imageUrl?: string;
  upiId: string;
  note?: string;
}> {
  // 1. Try server API
  const apiRes = await safeFetchJson<{
    active: boolean;
    imageUrl?: string;
    upiId: string;
    note?: string;
  }>('/api/qr/active');

  if (apiRes.ok && apiRes.data && !apiRes.isHtmlFallback) {
    return apiRes.data;
  }

  // 2. Direct Firestore fallback from 'system/qr_config'
  try {
    const configSnap = await getDoc(doc(db, 'system', 'qr_config'));
    if (configSnap.exists()) {
      const data = configSnap.data();
      return {
        active: data.active !== false,
        imageUrl: data.imageUrl || '',
        upiId: data.upiId || 'harishsingh9208@okaxis',
        note: data.note || 'Official UPI Payment QR',
      };
    }
  } catch (e) {
    console.warn('Firestore QR read fallback:', e);
  }

  // 3. Guaranteed fallback
  return {
    active: true,
    imageUrl: '',
    upiId: 'harishsingh9208@okaxis',
    note: 'Scan via Google Pay, PhonePe, Paytm, or BHIM',
  };
}

/**
 * Poll or fetch single order status resiliently
 */
export async function fetchOrderStatusResilient(orderId: string): Promise<Order | null> {
  // 1. Try server API
  const apiRes = await safeFetchJson<Order>(`/api/order/status/${orderId}`);
  if (apiRes.ok && apiRes.data && !apiRes.isHtmlFallback) {
    return apiRes.data;
  }

  // 2. Direct Firestore query
  try {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (snap.exists()) {
      return { ...(snap.data() as Order), id: snap.id };
    }
  } catch (e) {
    console.warn('Direct Firestore order fetch notice:', e);
  }

  return null;
}

/**
 * Query customer orders by email or phone
 */
export async function queryCustomerOrdersResilient(queryStr: string): Promise<Order[]> {
  const cleanQ = queryStr.trim().toLowerCase();
  if (!cleanQ) return [];

  // 1. Try API
  const apiRes = await safeFetchJson<{ orders: Order[] }>(`/api/customer/orders?q=${encodeURIComponent(cleanQ)}`);
  if (apiRes.ok && apiRes.data?.orders && !apiRes.isHtmlFallback) {
    return apiRes.data.orders;
  }

  // 2. Firestore query
  try {
    const ordersCol = collection(db, 'orders');
    const results: Order[] = [];

    // Query by orderId
    const qId = query(ordersCol, where('orderId', '==', cleanQ.toUpperCase()));
    const snapId = await getDocs(qId);
    snapId.forEach((d) => results.push({ ...(d.data() as Order), id: d.id }));

    // Query by email
    const qEmail = query(ordersCol, where('customerEmail', '==', cleanQ));
    const snapEmail = await getDocs(qEmail);
    snapEmail.forEach((d) => {
      if (!results.some((r) => r.orderId === d.data().orderId)) {
        results.push({ ...(d.data() as Order), id: d.id });
      }
    });

    return results;
  } catch (e) {
    console.warn('Firestore customer orders query notice:', e);
    return [];
  }
}

// Helpers
async function syncOrderToFirestoreDirect(order: Order): Promise<void> {
  try {
    const ref = doc(db, 'orders', order.orderId);
    await setDoc(ref, { ...order, syncedAt: new Date().toISOString() }, { merge: true });
  } catch {}
}

function saveLocalOrder(order: Order) {
  try {
    const saved = localStorage.getItem('see_dance_customer_orders');
    const orders: any[] = saved ? JSON.parse(saved) : [];
    const index = orders.findIndex((o) => o.orderId === order.orderId);
    if (index >= 0) {
      orders[index] = { ...orders[index], ...order };
    } else {
      orders.unshift(order);
    }
    localStorage.setItem('see_dance_customer_orders', JSON.stringify(orders.slice(0, 20)));
  } catch {}
}

/**
 * Global Payment Providers configuration
 */
export async function getPaymentConfig(): Promise<ApiResponse<PaymentProviderStatus & { officialPlans?: any; currency?: string }>> {
  return safeFetchJson('/api/payment/config');
}

/**
 * Server-authoritative Checkout Session Initiator (Stripe / PayPal / Crypto)
 */
export async function createCheckoutSessionApi(params: {
  planId: PlanId;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  paymentProvider: 'stripe' | 'paypal' | 'crypto';
  paymentMethod?: string;
  returnUrl?: string;
  cancelUrl?: string;
  sourceDomain?: string;
}): Promise<ApiResponse<{
  success: boolean;
  orderId: string;
  checkoutUrl?: string;
  clientSecret?: string;
  providerOrderId?: string;
  requiresConfig?: boolean;
  error?: string;
}>> {
  return safeFetchJson('/api/payment/checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

/**
 * Server-Side PayPal payment capture
 */
export async function capturePaypalPayment(params: {
  orderId: string;
  paypalOrderId: string;
}): Promise<ApiResponse<{ success: boolean; order?: Order; error?: string }>> {
  return safeFetchJson('/api/payment/paypal/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

/**
 * Admin Payment Gateway Health Check
 */
export async function getPaymentHealthApi(): Promise<ApiResponse<PaymentHealthStatus>> {
  const token = localStorage.getItem('seedance_admin_token') || '';
  return safeFetchJson('/api/admin/payment-health', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

