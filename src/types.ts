export type PlanId = 'PLAN_7_DAYS' | 'PLAN_30_DAYS' | 'PLAN_LIFETIME';

export interface PlanConfig {
  id: PlanId;
  name: string;
  duration: string;
  amount: number; // in USD ($5, $12, $400)
  amountCents?: number; // in cents (500, 1200, 40000)
  currency?: string; // 'USD'
  unlimited: boolean;
  isBestValue?: boolean;
  isLimitedSale?: boolean;
  description: string;
  features: string[];
  heroBadge?: string;
  heroTagline?: string;
  detailedSpecs?: {
    quota: string;
    resolution: string;
    speed: string;
    license: string;
  };
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'APPROVED' | 'FAILED' | 'REJECTED' | 'REFUNDED' | 'CANCELLED';

export interface Order {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  planId: PlanId;
  planName: string;
  duration: string;
  amount: number;
  amountCents?: number;
  currency?: string; // 'USD'
  paymentProvider?: 'stripe' | 'paypal' | 'crypto' | string;
  paymentMethod?: 'card' | 'paypal' | 'crypto' | string;
  providerOrderId?: string;
  providerTransactionId?: string;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  accessLink?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  refundedAt?: string;
  refundId?: string;
  refundAmount?: number;
  deletedAt?: string;
  deletedBy?: string;
  sourceDomain?: string;
}

export interface QRData {
  imageUrl: string;
  uploadedAt: string;
  active: boolean;
  fileName?: string;
  upiId?: string;
  note?: string;
}

export interface ShowcaseVideo {
  id: string;
  title: string;
  subtitle: string;
  badge: 'SEEDANCE 2.5' | 'SEEDANCE 2.0' | string;
  videoUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  duration?: string;
  resolution?: string;
  fps?: number;
  uploadedAt: string;
  order?: number;
}

export type DeletedOrder = Order & { deletedAt: string; deletedBy: string };

export interface CustomerMessage {
  messageId: string;
  orderId: string;
  customerEmail: string;
  message: string;
  sentAt: string;
  sentBy: string;
}

export interface AuditLog {
  auditLogId: string;
  adminUser: string;
  action: string;
  orderId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentProviderStatus {
  stripe: {
    configured: boolean;
    publishableKey?: string;
    mode: 'live' | 'test' | 'not_configured';
    webhookActive: boolean;
  };
  paypal: {
    configured: boolean;
    clientId?: string;
    mode: 'live' | 'sandbox' | 'not_configured';
    webhookActive: boolean;
  };
  crypto: {
    configured: boolean;
    provider?: string;
    webhookActive: boolean;
  };
}

export interface PaymentHealthStatus {
  stripe: 'Connected' | 'Not Connected' | 'Configuration Required';
  paypal: 'Connected' | 'Not Connected' | 'Configuration Required';
  crypto: 'Connected' | 'Not Connected' | 'Configuration Required';
  webhook: 'Active' | 'Ready' | 'Error';
  email: 'Connected' | 'Error';
  database: 'Connected' | 'Error';
}

export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  failedOrders: number;
  refundedOrders: number;
  totalRevenue: number;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  type: 'OWNER_NOTIFICATION' | 'CUSTOMER_ACCESS' | 'CUSTOMER_MESSAGE';
  sentAt: string;
  orderId?: string;
  status: 'SENT' | 'QUEUED' | 'LOGGED';
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
