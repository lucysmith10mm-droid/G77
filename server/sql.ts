// Use Node 22 native built-in SQLite engine (Zero external native dependency / GLIBC mismatch)
// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { Order, CustomerMessage, AuditLog, EmailLog, QRData } from '../src/types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SQLITE_FILE = path.join(DATA_DIR, 'seedance.sqlite');
let dbInstance: any = null;

export function getSqliteDb(): any {
  if (!dbInstance) {
    try {
      dbInstance = new DatabaseSync(SQLITE_FILE);
      console.log('[SQLite] Connected to native relational database:', SQLITE_FILE);
    } catch (err: any) {
      console.error('[SQLite] Connection error:', err?.message || err);
      throw err;
    }
  }
  return dbInstance;
}

// Initialize relational SQL tables
export function initSqlDatabase(): void {
  try {
    const db = getSqliteDb();

    // Orders Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        orderId TEXT UNIQUE NOT NULL,
        customerName TEXT NOT NULL,
        customerEmail TEXT NOT NULL,
        customerPhone TEXT,
        planId TEXT NOT NULL,
        planName TEXT NOT NULL,
        duration TEXT NOT NULL,
        amount REAL NOT NULL,
        amountCents INTEGER,
        currency TEXT DEFAULT 'USD',
        paymentProvider TEXT,
        paymentMethod TEXT,
        providerOrderId TEXT,
        providerTransactionId TEXT,
        paymentStatus TEXT NOT NULL,
        paymentReference TEXT,
        accessLink TEXT,
        adminNote TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        paidAt TEXT,
        refundedAt TEXT,
        approvedAt TEXT,
        rejectedAt TEXT
      );
    `);

    // Safely add any new columns to existing sqlite database
    const columnsToAdd = [
      'amountCents INTEGER',
      "currency TEXT DEFAULT 'USD'",
      'paymentProvider TEXT',
      'paymentMethod TEXT',
      'providerOrderId TEXT',
      'providerTransactionId TEXT',
      'paidAt TEXT',
      'refundedAt TEXT'
    ];
    for (const col of columnsToAdd) {
      try {
        db.exec(`ALTER TABLE orders ADD COLUMN ${col};`);
      } catch {
        // column already exists, safe to ignore
      }
    }

    // Customer Messages Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS customer_messages (
        messageId TEXT PRIMARY KEY,
        orderId TEXT NOT NULL,
        customerEmail TEXT NOT NULL,
        message TEXT NOT NULL,
        sentAt TEXT NOT NULL,
        sentBy TEXT NOT NULL
      );
    `);

    // Audit Logs Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        auditLogId TEXT PRIMARY KEY,
        adminUser TEXT NOT NULL,
        action TEXT NOT NULL,
        orderId TEXT,
        timestamp TEXT NOT NULL,
        metadata TEXT
      );
    `);

    // QR Configuration Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS qr_config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        imageUrl TEXT NOT NULL,
        upiId TEXT,
        active INTEGER NOT NULL,
        fileName TEXT,
        note TEXT,
        uploadedAt TEXT NOT NULL
      );
    `);

    // Email Logs Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id TEXT PRIMARY KEY,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        type TEXT NOT NULL,
        orderId TEXT,
        status TEXT NOT NULL,
        sentAt TEXT NOT NULL
      );
    `);

    console.log('[SQLite Backend] Relational database schemas verified & active.');
  } catch (err: any) {
    console.warn('[SQLite Backend] Schema initialization note:', err?.message || err);
  }
}

// SQL Synchronizers
export function saveOrderToSql(order: Order): void {
  try {
    const db = getSqliteDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO orders (
        id, orderId, customerName, customerEmail, customerPhone,
        planId, planName, duration, amount, amountCents, currency,
        paymentProvider, paymentMethod, providerOrderId, providerTransactionId,
        paymentStatus, paymentReference, accessLink, adminNote, createdAt, updatedAt,
        paidAt, refundedAt, approvedAt, rejectedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      order.id,
      order.orderId,
      order.customerName,
      order.customerEmail,
      order.customerPhone || null,
      order.planId,
      order.planName,
      order.duration,
      order.amount,
      order.amountCents || Math.round(order.amount * 100),
      order.currency || 'USD',
      order.paymentProvider || null,
      order.paymentMethod || null,
      order.providerOrderId || null,
      order.providerTransactionId || null,
      order.paymentStatus,
      order.paymentReference || null,
      order.accessLink || null,
      order.adminNote || null,
      order.createdAt,
      order.updatedAt,
      order.paidAt || null,
      order.refundedAt || null,
      order.paidAt || (order as any).approvedAt || null,
      (order as any).rejectedAt || null
    );
  } catch (err: any) {
    console.error('[SQLite] Error saving order:', err?.message || err);
  }
}

export function deleteOrderFromSql(orderId: string): void {
  try {
    const db = getSqliteDb();
    const stmt = db.prepare('DELETE FROM orders WHERE id = ? OR orderId = ?');
    stmt.run(orderId, orderId);
  } catch (err: any) {
    console.error('[SQLite] Error deleting order:', err?.message || err);
  }
}

export function saveMessageToSql(msg: CustomerMessage): void {
  try {
    const db = getSqliteDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO customer_messages (
        messageId, orderId, customerEmail, message, sentAt, sentBy
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(msg.messageId, msg.orderId, msg.customerEmail, msg.message, msg.sentAt, msg.sentBy);
  } catch (err: any) {
    console.error('[SQLite] Error saving message:', err?.message || err);
  }
}

export function saveAuditLogToSql(log: AuditLog): void {
  try {
    const db = getSqliteDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO audit_logs (
        auditLogId, adminUser, action, orderId, timestamp, metadata
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      log.auditLogId,
      log.adminUser,
      log.action,
      log.orderId || null,
      log.timestamp,
      log.metadata ? JSON.stringify(log.metadata) : null
    );
  } catch (err: any) {
    console.error('[SQLite] Error saving audit log:', err?.message || err);
  }
}

export function saveQRToSql(qr: QRData): void {
  try {
    const db = getSqliteDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO qr_config (
        id, imageUrl, upiId, active, fileName, note, uploadedAt
      ) VALUES (1, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(qr.imageUrl, qr.upiId || null, qr.active ? 1 : 0, qr.fileName || null, qr.note || null, qr.uploadedAt);
  } catch (err: any) {
    console.error('[SQLite] Error saving QR:', err?.message || err);
  }
}

export function saveEmailToSql(email: EmailLog): void {
  try {
    const db = getSqliteDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO email_logs (
        id, recipient, subject, body, type, orderId, status, sentAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(email.id, email.to, email.subject, email.body, email.type, email.orderId || null, email.status, email.sentAt);
  } catch (err: any) {
    console.error('[SQLite] Error saving email log:', err?.message || err);
  }
}

// SQL Query Helper
export function querySqlOrders(): Promise<Order[]> {
  return new Promise((resolve) => {
    try {
      const db = getSqliteDb();
      const stmt = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC');
      const rows = stmt.all();
      resolve(
        rows.map((r: any) => ({
          ...r,
          amount: Number(r.amount),
        }))
      );
    } catch (err: any) {
      console.error('[SQLite] Query error:', err?.message || err);
      resolve([]);
    }
  });
}

// Clear all orders from relational SQL database
export function clearAllOrdersFromSql(): void {
  try {
    const db = getSqliteDb();
    db.exec('DELETE FROM orders');
    console.log('[SQLite] All orders purged from SQL database.');
  } catch (err: any) {
    console.error('[SQLite] Error clearing orders:', err?.message || err);
  }
}

// Clear all audit logs from relational SQL database
export function clearAllAuditLogsFromSql(): void {
  try {
    const db = getSqliteDb();
    db.exec('DELETE FROM audit_logs');
    console.log('[SQLite] All audit logs purged from SQL database.');
  } catch (err: any) {
    console.error('[SQLite] Error clearing audit logs:', err?.message || err);
  }
}
