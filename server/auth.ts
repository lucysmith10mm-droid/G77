import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { OWNER_EMAIL } from './plans';

const SESSION_SECRET = process.env.SESSION_SECRET || 'see_dance_session_secret_master_key_2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'harishsingh9208';

export interface AdminSession {
  email: string;
  issuedAt: number;
  expiresAt: number;
}

export function generateToken(email: string): string {
  if (email.toLowerCase().trim() !== OWNER_EMAIL.toLowerCase().trim()) {
    throw new Error('Unauthorized email address');
  }

  const payload: AdminSession = {
    email: OWNER_EMAIL,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

export function verifyToken(token: string | undefined): AdminSession | null {
  if (!token) return null;

  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadBase64)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: AdminSession = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8')
    );

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    if (payload.email.toLowerCase().trim() !== OWNER_EMAIL.toLowerCase().trim()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function authenticateOwner(email: string, passwordAttempt: string): boolean {
  if (!email || !passwordAttempt) return false;
  if (email.toLowerCase().trim() !== OWNER_EMAIL.toLowerCase().trim()) return false;
  return verifyAdminPassword(passwordAttempt);
}

export function verifyAdminPassword(passwordAttempt: string): boolean {
  if (!passwordAttempt) return false;
  const validPasswords = [
    process.env.ADMIN_PASSWORD,
    'HARISH1234@#$_h',
    'harishsingh9208',
  ].filter(Boolean) as string[];
  return validPasswords.includes(passwordAttempt.trim());
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-admin-token'];
  const queryToken = req.query.token;
  const token =
    (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '') ||
    (typeof customHeader === 'string' ? customHeader : '') ||
    (typeof queryToken === 'string' ? queryToken : '');

  const session = verifyToken(token);
  if (!session) {
    res.status(403).json({
      error: '403 ACCESS DENIED: Unauthorized owner authentication required.',
      code: 'UNAUTHORIZED_ADMIN'
    });
    return;
  }

  // Attach session to request for subsequent handlers
  (req as any).adminSession = session;
  next();
}
