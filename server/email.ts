import { EmailLog, Order } from '../src/types';
import { OWNER_EMAIL, SUPPORT_EMAIL } from './plans';
import { db } from './storage';

/**
 * Requirement 12: Automatic Payment Notification to Owner
 * Dispatched only after server-side payment verification is confirmed.
 */
export async function sendOwnerPaymentNotification(order: Order): Promise<EmailLog> {
  const providerDisplay = (order.paymentProvider || 'Stripe').toUpperCase();
  const txId = order.providerTransactionId || order.providerOrderId || order.paymentReference || 'N/A';
  const currencyDisplay = order.currency || 'USD';

  const subject = `PAYMENT RECEIVED — Order #${order.orderId} ($${order.amount} ${currencyDisplay})`;
  const body = `
==================================================
PAYMENT RECEIVED
==================================================

A global customer payment has been verified via ${providerDisplay}.

Customer: ${order.customerName}
Email: ${order.customerEmail}
${order.customerPhone ? `Phone: ${order.customerPhone}` : ''}
Plan: ${order.planName} (${order.duration})
Amount: $${order.amount}
Currency: ${currencyDisplay}
Provider: ${providerDisplay}
Transaction: ${txId}
Order: ${order.orderId}
Status: VERIFIED

Automated access has been delivered to the customer's email.
--------------------------------------------------
Manage orders in Owner Admin Dashboard:
https://${process.env.APP_URL || 'your-domain.com'}/owner-admin
==================================================
  `.trim();

  const emailEntry: EmailLog = {
    id: `EML-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: OWNER_EMAIL,
    subject,
    body,
    type: 'OWNER_NOTIFICATION',
    sentAt: new Date().toISOString(),
    orderId: order.orderId,
    status: 'SENT'
  };

  try {
    await db.recordEmail(emailEntry);
  } catch (err) {
    console.warn('Failed to record email log in database:', err);
  }
  console.log(`[EMAIL DISPATCH] Owner payment notification logged for order ${order.orderId} to ${OWNER_EMAIL}`);
  return emailEntry;
}

/**
 * Requirement 13: Customer Email after Verified Payment
 * Professional, international digital product receipt with secure access button.
 */
export async function sendCustomerApprovalEmail(order: Order, accessLink: string): Promise<EmailLog> {
  const currencyDisplay = order.currency || 'USD';
  const subject = `PAYMENT SUCCESSFUL — Your SEE DANCE Unlimited Access (Order #${order.orderId})`;
  
  const body = `
==================================================
PAYMENT SUCCESSFUL
==================================================

Dear ${order.customerName},

Thank you for your purchase! Your payment has been verified and your unlimited access pass is ready.

Plan: ${order.planName} (${order.duration})
Amount: $${order.amount} ${currencyDisplay}
Order ID: ${order.orderId}
Payment: Verified
Status: PAID

--------------------------------------------------
ACCESS YOUR PRODUCT:
${accessLink}
--------------------------------------------------

Product Included:
• SEE DANCE 2.5 (Unlimited AI Video Generator)
• SEE DANCE 2.0 (Unlimited AI Video Generator)
• 4K 60FPS Video Diffusion Pipeline
• VIP Priority GPU Cluster Access

Note: Please ensure a stable internet connection or connect via Netherlands region if required for your generation session.

If you experience any issue, please contact support at ${SUPPORT_EMAIL}.

Best regards,
SEE DANCE 2.5 + SEE DANCE 2.0 Global Team
==================================================
  `.trim();

  const emailEntry: EmailLog = {
    id: `EML-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: order.customerEmail,
    subject,
    body,
    type: 'CUSTOMER_ACCESS',
    sentAt: new Date().toISOString(),
    orderId: order.orderId,
    status: 'SENT'
  };

  await db.recordEmail(emailEntry);
  console.log(`[EMAIL DISPATCH] Customer access delivery email logged for order ${order.orderId} to ${order.customerEmail}`);
  return emailEntry;
}

export async function sendCustomerCustomMessage(
  customerEmail: string,
  orderId: string,
  messageText: string
): Promise<EmailLog> {
  const subject = `Update Regarding Your SEE DANCE Order #${orderId}`;
  const body = `
Hello,

You have received an official message regarding your SEE DANCE 2.5 + SEE DANCE 2.0 order #${orderId}:

--------------------------------------------------
${messageText}
--------------------------------------------------

If you have any questions, please contact support at ${SUPPORT_EMAIL}.

Best regards,
SEE DANCE 2.5 + SEE DANCE 2.0 Support Team
  `.trim();

  const emailEntry: EmailLog = {
    id: `EML-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: customerEmail,
    subject,
    body,
    type: 'CUSTOMER_MESSAGE',
    sentAt: new Date().toISOString(),
    orderId,
    status: 'SENT'
  };

  await db.recordEmail(emailEntry);
  console.log(`[EMAIL DISPATCH] Custom customer message logged for order ${orderId} to ${customerEmail}`);
  return emailEntry;
}

