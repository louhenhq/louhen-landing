import { createHmac, timingSafeEqual } from 'node:crypto';

import { normalizeEmail } from '@/lib/email/suppress';
import { DEFAULT_LOCALE } from '@/lib/i18n/locales';

export type UnsubTokenPayload = {
  email: string;
  scope: 'transactional' | 'marketing' | 'all';
  exp: number;
};

function getSalt(): string {
  const salt = process.env.SUPPRESSION_SALT?.trim();
  if (!salt) {
    throw new Error('Missing SUPPRESSION_SALT');
  }
  return salt;
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  return Buffer.from(padded, 'base64');
}

const DEFAULT_EXP_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function signUnsubToken({ email, scope = 'all', exp }: { email: string; scope?: UnsubTokenPayload['scope']; exp?: number }) {
  const normalizedEmail = normalizeEmail(email);
  const payload: UnsubTokenPayload = {
    email: normalizedEmail,
    scope,
    exp: exp ?? Math.floor(Date.now() / 1000) + DEFAULT_EXP_SECONDS,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = base64UrlEncode(Buffer.from(payloadJson));
  const signature = createHmac('sha256', getSalt()).update(payloadBase64).digest();
  const signatureBase64 = base64UrlEncode(signature);
  return `${payloadBase64}.${signatureBase64}`;
}

export function verifyUnsubToken(token: string): UnsubTokenPayload | null {
  if (!token) return null;
  const [payloadBase64, signatureBase64] = token.split('.');
  if (!payloadBase64 || !signatureBase64) return null;

  const expectedSignature = createHmac('sha256', getSalt()).update(payloadBase64).digest();
  let providedSignature: Buffer;
  try {
    providedSignature = base64UrlDecode(signatureBase64);
  } catch {
    return null;
  }
  if (providedSignature.length !== expectedSignature.length) return null;
  if (!timingSafeEqual(providedSignature, expectedSignature)) return null;

  try {
    const payload: UnsubTokenPayload = JSON.parse(base64UrlDecode(payloadBase64).toString('utf8'));
    if (!payload || typeof payload !== 'object') return null;
    if (typeof payload.email !== 'string') return null;
    if (!['transactional', 'marketing', 'all'].includes(payload.scope)) return null;
    if (typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    payload.email = normalizeEmail(payload.email);
    payload.scope = payload.scope || 'all';
    return payload;
  } catch {
    return null;
  }
}

export function buildUnsubUrl(email: string, scope: UnsubTokenPayload['scope'] = 'all') {
  const token = signUnsubToken({ email, scope });
  const baseUrl = (process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://louhen.eu').replace(/\/$/, '');
  return `${baseUrl}/${DEFAULT_LOCALE.value}/unsubscribe?token=${encodeURIComponent(token)}`;
}
