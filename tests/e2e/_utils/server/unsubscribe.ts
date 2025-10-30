import { createHmac } from 'node:crypto';

type UnsubScope = 'transactional' | 'marketing' | 'all';

const DEFAULT_EXP_SECONDS = 60 * 60 * 24 * 7;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getSalt(): string {
  const raw = process.env.SUPPRESSION_SALT?.trim();
  if (raw && raw.length > 0) {
    return raw;
  }
  if ((process.env.TEST_MODE ?? '').toString() === '1') {
    return 'test-mode-salt';
  }
  throw new Error('Missing SUPPRESSION_SALT for unsubscribe token signing');
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function signUnsubscribeToken(email: string, scope: UnsubScope, exp?: number): string {
  const payload = {
    email: normalizeEmail(email),
    scope,
    exp: exp ?? Math.floor(Date.now() / 1000) + DEFAULT_EXP_SECONDS,
  };
  const json = JSON.stringify(payload);
  const encoded = base64UrlEncode(Buffer.from(json));
  const signature = createHmac('sha256', getSalt()).update(encoded).digest();
  const signatureEncoded = base64UrlEncode(signature);
  return `${encoded}.${signatureEncoded}`;
}

function resolveBaseUrl(): string {
  const fromEnv =
    process.env.APP_BASE_URL ??
    process.env.BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'https://louhen.eu';
  return fromEnv.replace(/\/$/, '');
}

function resolveLocale(): string {
  return (
    process.env.DEFAULT_LOCALE ??
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ??
    'de-de'
  );
}

export function buildUnsubscribeUrl(email: string, scope: UnsubScope = 'all'): string {
  const token = signUnsubscribeToken(email, scope);
  const baseUrl = resolveBaseUrl();
  const locale = resolveLocale();
  return `${baseUrl}/${locale}/unsubscribe?token=${encodeURIComponent(token)}`;
}
