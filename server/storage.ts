import fs from 'fs';
import path from 'path';
import { AuditLog, CustomerMessage, EmailLog, Order, PaymentStatus, PlanId, QRData, ShowcaseVideo } from '../src/types';
import { DEFAULT_ACCESS_LINK, OFFICIAL_PLANS, OWNER_EMAIL } from './plans';
import {
  initSqlDatabase,
  saveOrderToSql,
  saveMessageToSql,
  saveAuditLogToSql,
  saveQRToSql,
  saveEmailToSql,
  deleteOrderFromSql,
  clearAllOrdersFromSql,
  clearAllAuditLogsFromSql,
} from './sql';
import {
  syncOrderToFirestore,
  syncQRToFirestore,
  syncAuditLogToFirestore,
  deleteOrderFromFirestore,
  purgeAllOrdersFromFirestore,
  syncVideoToFirestore,
  deleteVideoFromFirestore,
  seedVideosToFirestore,
} from './firebase';

interface DatabaseSchema {
  orders: Order[];
  deletedOrders?: (Order & { deletedAt: string; deletedBy: string })[];
  messages: CustomerMessage[];
  auditLogs: AuditLog[];
  emails: EmailLog[];
  qrConfig: QRData;
  videos?: ShowcaseVideo[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Default initial high-contrast QR code (SVG data URL) for UPI instant payments
const DEFAULT_INITIAL_QR: QRData = {
  imageUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300"><rect width="300" height="300" fill="%23ffffff" rx="16"/><rect x="20" y="20" width="80" height="80" fill="%230f172a" rx="10"/><rect x="35" y="35" width="50" height="50" fill="%23ffffff" rx="5"/><rect x="45" y="45" width="30" height="30" fill="%230f172a" rx="3"/><rect x="200" y="20" width="80" height="80" fill="%230f172a" rx="10"/><rect x="215" y="35" width="50" height="50" fill="%23ffffff" rx="5"/><rect x="225" y="45" width="30" height="30" fill="%230f172a" rx="3"/><rect x="20" y="200" width="80" height="80" fill="%230f172a" rx="10"/><rect x="35" y="215" width="50" height="50" fill="%23ffffff" rx="5"/><rect x="45" y="225" width="30" height="30" fill="%230f172a" rx="3"/><rect x="120" y="20" width="20" height="40" fill="%230f172a"/><rect x="150" y="30" width="30" height="20" fill="%230f172a"/><rect x="120" y="80" width="60" height="20" fill="%230f172a"/><rect x="115" y="115" width="70" height="70" fill="%230f172a" rx="6"/><rect x="130" y="130" width="40" height="40" fill="%238b5cf6" rx="4"/><rect x="20" y="120" width="40" height="20" fill="%230f172a"/><rect x="40" y="150" width="50" height="30" fill="%230f172a"/><rect x="200" y="120" width="50" height="20" fill="%230f172a"/><rect x="240" y="150" width="40" height="30" fill="%230f172a"/><rect x="120" y="200" width="30" height="40" fill="%230f172a"/><rect x="170" y="210" width="40" height="30" fill="%230f172a"/><rect x="130" y="260" width="60" height="20" fill="%230f172a"/><rect x="220" y="220" width="60" height="60" fill="%230f172a" rx="6"/><text x="150" y="155" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23ffffff" text-anchor="middle">UPI</text><text x="150" y="292" font-family="sans-serif" font-size="10" font-weight="bold" fill="%2364748b" text-anchor="middle">SCAN &amp; PAY USING ANY UPI APP</text></svg>`,
  uploadedAt: new Date().toISOString(),
  active: true,
  fileName: 'owner_payment_qr.svg',
  upiId: 'harishsingh9208@okaxis',
  note: 'Active Official Payment QR'
};

const DEFAULT_INITIAL_VIDEOS: ShowcaseVideo[] = [
  {
    id: 'vid-seedance-25-cat-skydiving',
    title: 'Ginger Cat Skydiving',
    subtitle: 'Rainbow Parachute Freefall',
    badge: 'SEEDANCE 2.5',
    videoUrl: '/videos/myvideo1.mp4',
    thumbnailUrl: '/videos/thumb1.jpg',
    prompt: 'Orange ginger cat in harness jumps from airplane, spreads paws in terminal velocity freefall, opens rainbow parachute and lands on grass',
    duration: '0:06',
    resolution: '4K Native',
    fps: 60,
    uploadedAt: new Date().toISOString(),
    order: 1
  },
  {
    id: 'vid-seedance-25-cat-slap',
    title: 'Cat Paw Knockout',
    subtitle: 'Chalked Paw Combat Physics',
    badge: 'SEEDANCE 2.5',
    videoUrl: '/videos/myvideo2.mp4',
    thumbnailUrl: '/videos/thumb2.jpg',
    prompt: 'Cute cat held in referee hands delivers lightning-fast chalked paw slap to massive bearded champion, knocking him flat on boxing ring canvas',
    duration: '0:06',
    resolution: '4K Native',
    fps: 60,
    uploadedAt: new Date().toISOString(),
    order: 2
  },
  {
    id: 'vid-seedance-20-haaland-volcano',
    title: 'Haaland Volcano Drop',
    subtitle: 'Ice Core Magma Eruption',
    badge: 'SEEDANCE 2.0',
    videoUrl: '/videos/myvideo3.mp4',
    thumbnailUrl: '/videos/thumb3.jpg',
    prompt: 'Erling Haaland frozen in giant solid ice block pushed from airplane cargo bay into boiling magma crater, explosive steam blast catapulting back',
    duration: '0:06',
    resolution: '4K Native',
    fps: 60,
    uploadedAt: new Date().toISOString(),
    order: 3
  },
  {
    id: 'vid-seedance-25-volcano-popcorn',
    title: 'Volcano Popcorn Eruption',
    subtitle: 'Maine Coon Cheese Balls',
    badge: 'SEEDANCE 2.5',
    videoUrl: '/videos/myvideo4.mp4',
    thumbnailUrl: '/videos/thumb4.jpg',
    prompt: 'Fluffy Maine Coon cats dumping giant barrel of cheese balls into boiling magma crater, triggering huge popcorn mushroom cloud explosion',
    duration: '0:06',
    resolution: '4K Native',
    fps: 60,
    uploadedAt: new Date().toISOString(),
    order: 4
  },
  {
    id: 'vid-seedance-20-arctic-geyser',
    title: 'Arctic Molten Geyser',
    subtitle: 'Flying Fish Eruption Burst',
    badge: 'SEEDANCE 2.0',
    videoUrl: '/videos/myvideo5.mp4',
    thumbnailUrl: '/videos/thumb5.jpg',
    prompt: 'Worker in yellow hazard suit drops white-hot molten crucible from helicopter into arctic ice hole, blast geyser erupting frozen fish into aircraft',
    duration: '0:06',
    resolution: '4K Native',
    fps: 60,
    uploadedAt: new Date().toISOString(),
    order: 5
  },
  {
    id: 'vid-seedance-20-fjord-heli',
    title: 'Fjord Helicopter Dive',
    subtitle: 'Wingsuit Zero-G Loop',
    badge: 'SEEDANCE 2.0',
    videoUrl: '/videos/myvideo6.mp4',
    thumbnailUrl: '/videos/thumb6.jpg',
    prompt: 'Extreme wingsuit athlete leaps backwards from open helicopter hovering over steep Norwegian fjord, freefalls and catches helicopter skid in mid-air loop',
    duration: '0:06',
    resolution: '4K Native',
    fps: 60,
    uploadedAt: new Date().toISOString(),
    order: 6
  },
];

class StorageDatabase {
  private cache: DatabaseSchema;

  constructor() {
    this.cache = this.loadFromDisk();
    try {
      initSqlDatabase();
      // Synchronize existing cache to SQL
      for (const ord of this.cache.orders) {
        saveOrderToSql(ord);
      }
      saveQRToSql(this.cache.qrConfig);
      // Seed videos to Firestore data service if not present
      if (this.cache.videos && this.cache.videos.length > 0) {
        seedVideosToFirestore(this.cache.videos);
      }
    } catch (err) {
      console.warn('[Storage] Relational SQL bootstrap notice:', err);
    }
  }

  private loadFromDisk(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          orders: parsed.orders || [],
          deletedOrders: parsed.deletedOrders || [],
          messages: parsed.messages || [],
          auditLogs: parsed.auditLogs || [],
          emails: parsed.emails || [],
          qrConfig: parsed.qrConfig || DEFAULT_INITIAL_QR,
          videos: (parsed.videos && parsed.videos.length > 0) ? parsed.videos : DEFAULT_INITIAL_VIDEOS,
        };
      }
    } catch (e) {
      console.error('Error loading database from disk, initializing fresh cache:', e);
    }

    const initial: DatabaseSchema = {
      orders: [],
      deletedOrders: [],
      messages: [],
      auditLogs: [
        {
          auditLogId: 'AUD-INIT',
          adminUser: 'SYSTEM',
          action: 'DATABASE_INITIALIZED',
          timestamp: new Date().toISOString(),
          metadata: { note: 'Seed initialized with official SEE DANCE 2.5 + 2.0 specs' }
        }
      ],
      emails: [],
      qrConfig: DEFAULT_INITIAL_QR,
      videos: DEFAULT_INITIAL_VIDEOS,
    };

    this.saveToDisk(initial);
    return initial;
  }

  public saveToDisk(data?: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const dataToSave = data || this.cache;
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database to disk:', e);
    }
  }

  // --- Showcase Videos ---
  public getVideos(): ShowcaseVideo[] {
    if (!this.cache.videos || this.cache.videos.length === 0) {
      this.cache.videos = [...DEFAULT_INITIAL_VIDEOS];
      this.saveToDisk();
    }
    return [...this.cache.videos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  public getVideoById(id: string): ShowcaseVideo | undefined {
    return this.getVideos().find(v => v.id === id);
  }

  public addVideo(video: Omit<ShowcaseVideo, 'id' | 'uploadedAt'> & { id?: string; uploadedAt?: string }): ShowcaseVideo {
    const newVideo: ShowcaseVideo = {
      id: video.id || `vid-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title: video.title || 'Untitled Generation',
      subtitle: video.subtitle || 'SEE DANCE AI Video',
      badge: video.badge || 'SEEDANCE 2.5',
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      prompt: video.prompt || '',
      duration: video.duration || '0:05',
      resolution: video.resolution || '4K Native',
      fps: video.fps || 60,
      uploadedAt: video.uploadedAt || new Date().toISOString(),
      order: video.order ?? (this.cache.videos ? this.cache.videos.length + 1 : 1)
    };

    if (!this.cache.videos) {
      this.cache.videos = [...DEFAULT_INITIAL_VIDEOS];
    }
    this.cache.videos.push(newVideo);
    this.saveToDisk();
    try {
      syncVideoToFirestore(newVideo);
    } catch (e) {
      console.warn('[Storage] Video Firestore sync notice:', e);
    }
    return newVideo;
  }

  public deleteVideo(id: string): boolean {
    if (!this.cache.videos) return false;
    const initialLen = this.cache.videos.length;
    this.cache.videos = this.cache.videos.filter(v => v.id !== id);
    if (this.cache.videos.length !== initialLen) {
      this.saveToDisk();
      try {
        deleteVideoFromFirestore(id);
      } catch (e) {
        console.warn('[Storage] Video Firestore delete notice:', e);
      }
      return true;
    }
    return false;
  }

  public updateVideo(id: string, updates: Partial<ShowcaseVideo>): ShowcaseVideo | null {
    if (!this.cache.videos) return null;
    const idx = this.cache.videos.findIndex(v => v.id === id);
    if (idx === -1) return null;
    this.cache.videos[idx] = { ...this.cache.videos[idx], ...updates };
    this.saveToDisk();
    try {
      syncVideoToFirestore(this.cache.videos[idx]);
    } catch (e) {
      console.warn('[Storage] Video Firestore update notice:', e);
    }
    return this.cache.videos[idx];
  }

  // --- Orders ---
  public getOrders(): Order[] {
    return [...this.cache.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getOrderById(id: string): Order | undefined {
    return this.cache.orders.find(o => o.id === id || o.orderId === id);
  }

  public getCustomerOrders(criteria: { ids?: string[]; email?: string; phone?: string }): Order[] {
    const { ids, email, phone } = criteria;
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPhone = phone?.trim();
    const idSet = ids && ids.length > 0 ? new Set(ids.map(i => i.trim())) : null;

    return this.cache.orders.filter(order => {
      if (idSet && (idSet.has(order.id) || idSet.has(order.orderId))) {
        return true;
      }
      if (cleanEmail && order.customerEmail.toLowerCase() === cleanEmail) {
        return true;
      }
      if (cleanPhone && (order.customerPhone === cleanPhone || order.customerPhone.includes(cleanPhone))) {
        return true;
      }
      return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createOrder(input: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    planId: PlanId;
    paymentProvider?: string;
    paymentMethod?: string;
    providerOrderId?: string;
    paymentReference?: string;
    sourceDomain?: string;
  }): Order {
    const plan = OFFICIAL_PLANS[input.planId];
    if (!plan) {
      throw new Error(`Invalid plan ID: ${input.planId}`);
    }

    // Generate unique Order ID with SD- prefix
    const randomHex = Math.floor(100000 + Math.random() * 900000);
    const orderId = `SD-${randomHex}`;
    const id = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const now = new Date().toISOString();
    const newOrder: Order = {
      id,
      orderId,
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail.trim().toLowerCase(),
      customerPhone: input.customerPhone?.trim() || undefined,
      planId: plan.id,
      planName: plan.name,
      duration: plan.duration,
      amount: plan.amount, // Server-determined authoritative price ($4, $15, $80)
      amountCents: plan.amountCents || Math.round(plan.amount * 100),
      currency: 'USD',
      paymentProvider: input.paymentProvider || 'stripe',
      paymentMethod: input.paymentMethod || 'card',
      providerOrderId: input.providerOrderId,
      paymentStatus: 'PENDING',
      paymentReference: input.paymentReference?.trim() || undefined,
      accessLink: DEFAULT_ACCESS_LINK,
      createdAt: now,
      updatedAt: now,
      sourceDomain: input.sourceDomain,
    };

    this.cache.orders.unshift(newOrder);
    this.addAuditLog({
      adminUser: 'SYSTEM',
      action: 'ORDER_CREATED',
      orderId: newOrder.orderId,
      metadata: {
        customer: newOrder.customerEmail,
        plan: newOrder.planId,
        amount: newOrder.amount,
        currency: 'USD',
        provider: newOrder.paymentProvider
      }
    });

    this.saveToDisk();
    try {
      saveOrderToSql(newOrder);
      syncOrderToFirestore(newOrder);
    } catch (e) {
      console.warn('[Storage] Order sync notice:', e);
    }
    return newOrder;
  }

  /**
   * Requirement 7 & 8: Mark order as PAID after server-side payment verification
   * Idempotent: safe against duplicate webhook calls.
   * Dispatches automatic access delivery email and owner notification.
   */
  public async markOrderPaid(
    orderId: string,
    details: {
      provider?: string;
      transactionId?: string;
      providerOrderId?: string;
      paidAt?: string;
      customAccessLink?: string;
    }
  ): Promise<{ order: Order; alreadyPaid: boolean }> {
    const order = this.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.paymentStatus === 'PAID') {
      return { order, alreadyPaid: true };
    }

    const now = details.paidAt || new Date().toISOString();
    order.paymentStatus = 'PAID';
    order.paidAt = now;
    order.updatedAt = now;
    if (details.transactionId) order.providerTransactionId = details.transactionId;
    if (details.providerOrderId) order.providerOrderId = details.providerOrderId;
    if (details.provider) order.paymentProvider = details.provider;
    if (details.customAccessLink) order.accessLink = details.customAccessLink;

    this.addAuditLog({
      adminUser: 'PAYMENT_VERIFIED_WEBHOOK',
      action: 'ORDER_VERIFIED_PAID',
      orderId: order.orderId,
      metadata: {
        provider: order.paymentProvider,
        transactionId: order.providerTransactionId,
        amount: order.amount,
        currency: order.currency || 'USD'
      }
    });

    this.saveToDisk();
    try {
      saveOrderToSql(order);
      syncOrderToFirestore(order);
    } catch (e) {
      console.warn('[Storage] Order sync notice:', e);
    }

    // Trigger access delivery and owner notification exactly once
    try {
      const { sendCustomerApprovalEmail, sendOwnerPaymentNotification } = await import('./email');
      const accessLink = order.accessLink || DEFAULT_ACCESS_LINK;
      await Promise.allSettled([
        sendCustomerApprovalEmail(order, accessLink),
        sendOwnerPaymentNotification(order)
      ]);
    } catch (emailErr) {
      console.warn('[Storage] Automated email delivery notice:', emailErr);
    }

    return { order, alreadyPaid: false };
  }

  /**
   * Requirement 16: Handle Refund
   */
  public markOrderRefunded(
    orderId: string,
    details: {
      refundId?: string;
      refundAmount?: number;
      provider?: string;
      reason?: string;
      adminEmail?: string;
      refundedAt?: string;
    }
  ): Order {
    const order = this.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const now = new Date().toISOString();
    order.paymentStatus = 'REFUNDED';
    order.refundedAt = now;
    order.refundId = details.refundId;
    order.refundAmount = details.refundAmount;
    order.updatedAt = now;

    this.addAuditLog({
      adminUser: 'PAYMENT_PROVIDER_WEBHOOK',
      action: 'PAYMENT_REFUNDED',
      orderId: order.orderId,
      metadata: details
    });

    this.saveToDisk();
    try {
      saveOrderToSql(order);
      syncOrderToFirestore(order);
    } catch (e) {}

    return order;
  }

  public createOrSubmitPayment(input: {
    orderId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    planId?: PlanId;
    paymentReference?: string;
  }): Order {
    const now = new Date().toISOString();

    // 1. If orderId is provided, look it up
    if (input.orderId) {
      const existing = this.getOrderById(input.orderId);
      if (existing) {
        existing.paymentStatus = 'PENDING';
        if (input.paymentReference) {
          existing.paymentReference = input.paymentReference.trim();
        }
        existing.updatedAt = now;

        this.addAuditLog({
          adminUser: 'CUSTOMER',
          action: 'PAYMENT_SUBMITTED',
          orderId: existing.orderId,
          metadata: { paymentReference: existing.paymentReference }
        });

        this.saveToDisk();
        try {
          saveOrderToSql(existing);
          syncOrderToFirestore(existing);
        } catch (e) {
          console.warn('[Storage] Order sync notice:', e);
        }
        return existing;
      }
    }

    // 2. Duplicate submission protection: check for recent matching pending order (within 60s)
    if (input.customerEmail && input.planId) {
      const normalizedEmail = input.customerEmail.trim().toLowerCase();
      const recentPending = this.cache.orders.find(o =>
        o.customerEmail === normalizedEmail &&
        o.planId === input.planId &&
        o.paymentStatus === 'PENDING' &&
        (Date.now() - new Date(o.createdAt).getTime()) < 60000
      );

      if (recentPending) {
        if (input.paymentReference) {
          recentPending.paymentReference = input.paymentReference.trim();
        }
        recentPending.updatedAt = now;
        this.saveToDisk();
        try {
          saveOrderToSql(recentPending);
          syncOrderToFirestore(recentPending);
        } catch (e) {}
        return recentPending;
      }
    }

    // 3. Create fresh order with validated details
    if (!input.customerName || !input.customerEmail || !input.customerPhone || !input.planId) {
      throw new Error('Customer name, email, phone, and plan are required to create a payment submission.');
    }

    return this.createOrder({
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      planId: input.planId,
      paymentReference: input.paymentReference
    });
  }

  public submitPayment(orderId: string, paymentReference?: string): Order {
    const order = this.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    order.paymentStatus = 'PENDING';
    order.paymentReference = paymentReference?.trim() || 'Customer verified via "I HAVE PAID"';
    order.updatedAt = new Date().toISOString();

    this.addAuditLog({
      adminUser: 'CUSTOMER',
      action: 'PAYMENT_SUBMITTED',
      orderId: order.orderId,
      metadata: { paymentReference: order.paymentReference }
    });

    this.saveToDisk();
    try {
      saveOrderToSql(order);
      syncOrderToFirestore(order);
    } catch (e) {
      console.warn('[Storage] Order sync notice:', e);
    }
    return order;
  }

  public approveOrder(orderId: string, customAccessLink: string | undefined, adminUser: string): Order {
    const order = this.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const now = new Date().toISOString();
    order.paymentStatus = 'APPROVED';
    order.accessLink = customAccessLink?.trim() || order.accessLink || DEFAULT_ACCESS_LINK;
    order.approvedAt = now;
    order.updatedAt = now;

    this.addAuditLog({
      adminUser,
      action: 'PAYMENT_APPROVED',
      orderId: order.orderId,
      metadata: {
        accessLink: order.accessLink,
        approvedAt: order.approvedAt
      }
    });

    this.saveToDisk();
    try {
      saveOrderToSql(order);
      syncOrderToFirestore(order);
    } catch (e) {
      console.warn('[Storage] Order sync notice:', e);
    }
    return order;
  }

  public rejectOrder(orderId: string, adminUser: string, reason?: string): Order {
    const order = this.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const now = new Date().toISOString();
    order.paymentStatus = 'REJECTED';
    order.rejectedAt = now;
    order.updatedAt = now;
    if (reason) {
      order.adminNote = (order.adminNote ? `${order.adminNote} | ` : '') + `Rejected: ${reason}`;
    }

    this.addAuditLog({
      adminUser,
      action: 'PAYMENT_REJECTED',
      orderId: order.orderId,
      metadata: { rejectedAt: order.rejectedAt, reason }
    });

    this.saveToDisk();
    try {
      saveOrderToSql(order);
      syncOrderToFirestore(order);
    } catch (e) {
      console.warn('[Storage] Order sync notice:', e);
    }
    return order;
  }

  public updateOrderStatus(orderId: string, status: PaymentStatus, adminUser: string, reason?: string, customAccessLink?: string): Order {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    const now = new Date().toISOString();
    order.paymentStatus = status;
    order.updatedAt = now;
    if (status === 'APPROVED') {
      order.approvedAt = now;
      if (customAccessLink) order.accessLink = customAccessLink.trim();
    } else if (status === 'REJECTED') {
      order.rejectedAt = now;
      if (reason) order.adminNote = (order.adminNote ? `${order.adminNote} | ` : '') + `Rejected: ${reason}`;
    } else if (status === 'PAID') {
      order.paidAt = now;
    }
    this.addAuditLog({
      adminUser,
      action: `ORDER_STATUS_CHANGED_TO_${status}`,
      orderId: order.orderId,
      metadata: { newStatus: status, reason }
    });
    this.saveToDisk();
    try {
      saveOrderToSql(order);
      syncOrderToFirestore(order);
    } catch (e) {}
    return order;
  }

  public updateAdminNote(orderId: string, adminNote: string, adminUser: string): Order {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    order.adminNote = adminNote;
    order.updatedAt = new Date().toISOString();

    this.addAuditLog({
      adminUser,
      action: 'ADMIN_NOTE_UPDATED',
      orderId: order.orderId,
      metadata: { note: adminNote }
    });

    this.saveToDisk();
    return order;
  }

  public updateAccessLink(orderId: string, accessLink: string, adminUser: string): Order {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    order.accessLink = accessLink.trim();
    order.updatedAt = new Date().toISOString();

    this.addAuditLog({
      adminUser,
      action: 'ACCESS_LINK_UPDATED',
      orderId: order.orderId,
      metadata: { accessLink: order.accessLink }
    });

    this.saveToDisk();
    return order;
  }

  public createBackupSnapshot(trigger: string): string {
    try {
      const backupDir = path.join(DATA_DIR, 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const safeTrigger = trigger.replace(/[^a-z0-9_-]/gi, '_');
      const filename = `backup_${Date.now()}_${safeTrigger}.json`;
      const fullPath = path.join(backupDir, filename);
      fs.writeFileSync(fullPath, JSON.stringify(this.cache, null, 2), 'utf-8');
      return filename;
    } catch (e) {
      console.warn('[Storage] Snapshot error:', e);
      return '';
    }
  }

  public getBackupData(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.cache));
  }

  public deleteOrder(orderId: string, adminUser: string): boolean {
    if (!this.cache.deletedOrders) this.cache.deletedOrders = [];

    const index = this.cache.orders.findIndex(o => o.id === orderId || o.orderId === orderId);
    if (index === -1) return false;

    // Snapshot before modifying
    this.createBackupSnapshot(`delete_${orderId}`);

    const [deleted] = this.cache.orders.splice(index, 1);
    const deletedRecord = {
      ...deleted,
      deletedAt: new Date().toISOString(),
      deletedBy: adminUser
    };

    this.cache.deletedOrders.unshift(deletedRecord);

    this.addAuditLog({
      adminUser,
      action: 'ORDER_MOVED_TO_TRASH',
      orderId: deleted.orderId,
      metadata: {
        customerEmail: deleted.customerEmail,
        customerName: deleted.customerName,
        customerPhone: deleted.customerPhone,
        amount: deleted.amount,
        paymentStatus: deleted.paymentStatus,
        paymentReference: deleted.paymentReference || 'N/A'
      }
    });

    this.saveToDisk();
    try {
      deleteOrderFromSql(deleted.id);
      deleteOrderFromSql(deleted.orderId);
      deleteOrderFromFirestore(deleted.orderId);
      if (deleted.id !== deleted.orderId) {
        deleteOrderFromFirestore(deleted.id);
      }
    } catch (e) {
      console.warn('[Storage] Order delete sync note:', e);
    }
    return true;
  }

  public bulkDeleteOrders(orderIds: string[] | 'ALL', adminUser: string): { count: number } {
    if (!this.cache.deletedOrders) this.cache.deletedOrders = [];

    this.createBackupSnapshot('bulk_delete');

    let toMove: Order[] = [];
    if (orderIds === 'ALL') {
      toMove = [...this.cache.orders];
      this.cache.orders = [];
    } else {
      const idSet = new Set(orderIds.map(i => i.trim()));
      const remaining: Order[] = [];
      for (const order of this.cache.orders) {
        if (idSet.has(order.id) || idSet.has(order.orderId)) {
          toMove.push(order);
        } else {
          remaining.push(order);
        }
      }
      this.cache.orders = remaining;
    }

    const now = new Date().toISOString();
    const records = toMove.map(ord => ({
      ...ord,
      deletedAt: now,
      deletedBy: adminUser
    }));

    this.cache.deletedOrders.unshift(...records);

    this.addAuditLog({
      adminUser,
      action: 'ORDERS_BULK_MOVED_TO_TRASH',
      metadata: {
        count: toMove.length,
        isAll: orderIds === 'ALL',
        deletedOrderIds: toMove.map(o => o.orderId)
      }
    });

    this.saveToDisk();
    for (const ord of toMove) {
      try {
        deleteOrderFromSql(ord.id);
        deleteOrderFromSql(ord.orderId);
        deleteOrderFromFirestore(ord.orderId);
        if (ord.id !== ord.orderId) {
          deleteOrderFromFirestore(ord.id);
        }
      } catch (e) {}
    }
    return { count: toMove.length };
  }

  public getDeletedOrders(): (Order & { deletedAt: string; deletedBy: string })[] {
    if (!this.cache.deletedOrders) this.cache.deletedOrders = [];
    return [...this.cache.deletedOrders].sort(
      (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
    );
  }

  public restoreOrder(orderId: string, adminUser: string): Order | null {
    if (!this.cache.deletedOrders) this.cache.deletedOrders = [];

    const index = this.cache.deletedOrders.findIndex(o => o.id === orderId || o.orderId === orderId);
    if (index === -1) return null;

    const [item] = this.cache.deletedOrders.splice(index, 1);
    const restored: Order = {
      id: item.id,
      orderId: item.orderId,
      customerName: item.customerName,
      customerEmail: item.customerEmail,
      customerPhone: item.customerPhone,
      planId: item.planId,
      planName: item.planName,
      duration: item.duration,
      amount: item.amount,
      paymentStatus: item.paymentStatus,
      paymentReference: item.paymentReference,
      accessLink: item.accessLink,
      adminNote: item.adminNote,
      createdAt: item.createdAt,
      updatedAt: new Date().toISOString(),
      approvedAt: item.approvedAt,
      rejectedAt: item.rejectedAt,
    };

    this.cache.orders.unshift(restored);

    this.addAuditLog({
      adminUser,
      action: 'ORDER_RESTORED_FROM_TRASH',
      orderId: restored.orderId,
      metadata: {
        customerEmail: restored.customerEmail,
        restoredBy: adminUser
      }
    });

    this.saveToDisk();
    try {
      saveOrderToSql(restored);
      syncOrderToFirestore(restored);
    } catch (e) {}
    return restored;
  }

  public permanentDeleteOrder(orderId: string, adminUser: string): boolean {
    if (!this.cache.deletedOrders) this.cache.deletedOrders = [];

    const index = this.cache.deletedOrders.findIndex(o => o.id === orderId || o.orderId === orderId);
    if (index === -1) return false;

    this.createBackupSnapshot(`perm_delete_${orderId}`);
    const [purged] = this.cache.deletedOrders.splice(index, 1);

    this.addAuditLog({
      adminUser,
      action: 'ORDER_PERMANENTLY_PURGED',
      orderId: purged.orderId,
      metadata: {
        customerEmail: purged.customerEmail,
        purgedBy: adminUser
      }
    });

    this.saveToDisk();
    try {
      deleteOrderFromSql(purged.id);
      deleteOrderFromSql(purged.orderId);
      deleteOrderFromFirestore(purged.orderId);
      if (purged.id !== purged.orderId) {
        deleteOrderFromFirestore(purged.id);
      }
    } catch (e) {}
    return true;
  }

  public emptyTrash(adminUser: string): { count: number } {
    if (!this.cache.deletedOrders) this.cache.deletedOrders = [];
    const count = this.cache.deletedOrders.length;
    const purgedItems = [...this.cache.deletedOrders];
    if (count > 0) {
      this.createBackupSnapshot('empty_trash');
      this.cache.deletedOrders = [];
      this.addAuditLog({
        adminUser,
        action: 'TRASH_EMPTIED_ALL_PURGED',
        metadata: {
          purgedCount: count,
          emptiedBy: adminUser
        }
      });
      this.saveToDisk();
      for (const purged of purgedItems) {
        try {
          deleteOrderFromSql(purged.id);
          deleteOrderFromSql(purged.orderId);
          deleteOrderFromFirestore(purged.orderId);
          if (purged.id !== purged.orderId) {
            deleteOrderFromFirestore(purged.id);
          }
        } catch (e) {}
      }
    }
    return { count };
  }

  public purgeAllHistory(adminUser: string): { purgedOrders: number; purgedDeleted: number } {
    this.createBackupSnapshot('purge_all_history');
    const purgedOrders = (this.cache.orders || []).length;
    const purgedDeleted = (this.cache.deletedOrders || []).length;

    this.cache.orders = [];
    this.cache.deletedOrders = [];
    this.cache.messages = [];
    this.cache.emails = [];
    this.cache.auditLogs = [
      {
        auditLogId: `AUD-FRESH-${Date.now()}`,
        adminUser,
        action: 'ALL_HISTORY_PURGED_FRESH_START',
        timestamp: new Date().toISOString(),
        metadata: {
          note: 'All old test history completely purged. Clean fresh portal initialized.',
          purgedOrders,
          purgedDeleted,
          purgedBy: adminUser,
        },
      },
    ];

    this.saveToDisk();

    try {
      clearAllOrdersFromSql();
      clearAllAuditLogsFromSql();
      purgeAllOrdersFromFirestore();
    } catch (e) {
      console.warn('[Storage] Clear secondary stores note:', e);
    }

    return { purgedOrders, purgedDeleted };
  }

  // --- Customer Messages ---
  public addCustomerMessage(orderId: string, customerEmail: string, message: string, sentBy: string): CustomerMessage {
    const msg: CustomerMessage = {
      messageId: `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderId,
      customerEmail,
      message,
      sentAt: new Date().toISOString(),
      sentBy
    };

    this.cache.messages.unshift(msg);
    this.addAuditLog({
      adminUser: sentBy,
      action: 'CUSTOMER_MESSAGE_SENT',
      orderId,
      metadata: { customerEmail, messagePreview: message.substring(0, 50) }
    });

    this.saveToDisk();
    try {
      saveMessageToSql(msg);
    } catch (e) {
      console.warn('[Storage] Message SQL notice:', e);
    }
    return msg;
  }

  public getMessages(orderId?: string): CustomerMessage[] {
    if (orderId) {
      return this.cache.messages.filter(m => m.orderId === orderId);
    }
    return [...this.cache.messages];
  }

  // --- Audit Logs ---
  public addAuditLog(entry: {
    adminUser: string;
    action: string;
    orderId?: string;
    metadata?: Record<string, unknown>;
  }): AuditLog {
    const log: AuditLog = {
      auditLogId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      adminUser: entry.adminUser,
      action: entry.action,
      orderId: entry.orderId,
      timestamp: new Date().toISOString(),
      metadata: entry.metadata
    };

    this.cache.auditLogs.unshift(log);
    // Keep max 500 logs
    if (this.cache.auditLogs.length > 500) {
      this.cache.auditLogs.pop();
    }

    try {
      saveAuditLogToSql(log);
      syncAuditLogToFirestore(log);
    } catch (e) {
      // Non-blocking log sync
    }

    return log;
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.cache.auditLogs];
  }

  // --- Email Logs ---
  public recordEmail(entry: EmailLog): void {
    this.cache.emails.unshift(entry);
    if (this.cache.emails.length > 300) {
      this.cache.emails.pop();
    }
    this.saveToDisk();
    try {
      saveEmailToSql(entry);
    } catch (e) {
      // Non-blocking email log sync
    }
  }

  public getEmailLogs(): EmailLog[] {
    return [...this.cache.emails];
  }

  // --- QR Management (Owner Only) ---
  public getActiveQR(): QRData {
    return this.cache.qrConfig;
  }

  public updateActiveQR(input: {
    imageUrl: string;
    adminUser: string;
    fileName?: string;
    upiId?: string;
    note?: string;
  }): QRData {
    this.cache.qrConfig = {
      imageUrl: input.imageUrl,
      uploadedAt: new Date().toISOString(),
      active: true,
      fileName: input.fileName || 'custom_owner_qr.png',
      upiId: input.upiId || this.cache.qrConfig.upiId,
      note: input.note || 'Updated by Owner'
    };

    this.addAuditLog({
      adminUser: input.adminUser,
      action: 'PAYMENT_QR_UPDATED',
      metadata: { fileName: input.fileName, upiId: input.upiId }
    });

    this.saveToDisk();
    try {
      saveQRToSql(this.cache.qrConfig);
      syncQRToFirestore(this.cache.qrConfig);
    } catch (e) {
      console.warn('[Storage] QR sync notice:', e);
    }
    return this.cache.qrConfig;
  }

  public removeActiveQR(adminUser: string): QRData {
    this.cache.qrConfig = {
      imageUrl: '',
      uploadedAt: new Date().toISOString(),
      active: false,
      note: 'Payment QR removed by owner'
    };

    this.addAuditLog({
      adminUser,
      action: 'PAYMENT_QR_REMOVED',
      metadata: { note: 'Owner disabled active QR' }
    });

    this.saveToDisk();
    try {
      saveQRToSql(this.cache.qrConfig);
      syncQRToFirestore(this.cache.qrConfig);
    } catch (e) {
      console.warn('[Storage] QR removal sync notice:', e);
    }
    return this.cache.qrConfig;
  }

  // --- Stats ---
  public getStats(): {
    totalOrders: number;
    pendingOrders: number;
    paidOrders: number;
    approvedOrders: number;
    failedOrders: number;
    rejectedOrders: number;
    refundedOrders: number;
    totalRevenue: number;
  } {
    let pending = 0;
    let paid = 0;
    let failed = 0;
    let refunded = 0;
    let revenue = 0;

    for (const order of this.cache.orders) {
      const status = order.paymentStatus;
      if (status === 'PENDING') {
        pending++;
      } else if (status === 'PAID' || (status as any) === 'APPROVED') {
        paid++;
        revenue += order.amount;
      } else if (status === 'FAILED' || (status as any) === 'REJECTED') {
        failed++;
      } else if (status === 'REFUNDED') {
        refunded++;
      }
    }

    return {
      totalOrders: this.cache.orders.length,
      pendingOrders: pending,
      paidOrders: paid,
      approvedOrders: paid,
      failedOrders: failed,
      rejectedOrders: failed,
      refundedOrders: refunded,
      totalRevenue: revenue
    };
  }
}

export const db = new StorageDatabase();
