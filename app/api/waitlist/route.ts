import 'server-only';

import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebaseAdmin';
import { emailHash } from '@/lib/crypto/emailHash';
import { hashIp } from '@/lib/crypto/ipHash';
import { getWaitlistConfirmTtlMs } from '@/lib/waitlistConfirmTtl';
import { waitlistPayloadSchema, type WaitlistPayload } from '@/lib/waitlist/schema';
import { sendWaitlistConfirmEmail } from '@/lib/waitlist/email';
import { logAnalyticsEvent } from '@/lib/analytics';
import { isTestMode } from '@/lib/testMode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_REQUESTS_PER_WINDOW = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
type RateBucket = { count: number; resetAt: number };

const rateLimiterGlobal = globalThis as unknown as {
  __waitlistBuckets?: Map<string, RateBucket>;
};

if (!rateLimiterGlobal.__waitlistBuckets) {
  rateLimiterGlobal.__waitlistBuckets = new Map();
}

const RATE_BUCKETS = rateLimiterGlobal.__waitlistBuckets;

type CaptchaVerificationResult = {
  success: boolean;
  score?: number;
  errorCodes?: string[];
};

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (!forwarded) return 'unknown';
  const first = forwarded.split(',')[0]?.trim();
  return first || 'unknown';
}

function consumeRate(ip: string) {
  const now = Date.now();
  const bucket = RATE_BUCKETS.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    RATE_BUCKETS.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true } as const;
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterMs: Math.max(bucket.resetAt - now, 0) } as const;
  }

  bucket.count += 1;
  return { allowed: true } as const;
}

function createConfirmToken() {
  const token = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

async function verifyCaptcha(token: string, ip: string | null): Promise<CaptchaVerificationResult> {
  if (isTestMode()) {
    return { success: true };
  }
  const secret = process.env.HCAPTCHA_SECRET?.trim();
  if (!secret) {
    throw new Error('Missing HCAPTCHA_SECRET');
  }

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== 'unknown') {
    body.set('remoteip', ip);
  }

  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    const result = (await response.json()) as { success: boolean; score?: number; 'error-codes'?: string[] };
    return { success: Boolean(result.success), score: result.score, errorCodes: result['error-codes'] };
  } catch (error) {
    console.error('hCaptcha verification failed', error);
    return { success: false, errorCodes: ['network_error'] };
  }
}

function buildConfirmUrl(token: string): string {
  const baseUrl = process.env.APP_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error('Missing APP_BASE_URL');
  }
  const normalizedBase = baseUrl.replace(/\/$/, '');
  return `${normalizedBase}/api/waitlist/confirm?token=${encodeURIComponent(token)}`;
}

type PersistResult = {
  created: boolean;
  status: 'pending' | 'confirmed';
};

async function persistWaitlist(
  docId: string,
  payload: WaitlistPayload,
  tokenHash: string,
  expiresAt: Date,
  ipHash: string | null
): Promise<PersistResult> {
  if (isTestMode()) {
    return { created: true, status: 'pending' };
  }
  const app = initAdmin();
  const db = app.firestore();
  const ref = db.collection('waitlist').doc(docId);
  const snapshot = await ref.get();
  const now = FieldValue.serverTimestamp();

  const baseData = {
    email: payload.email,
    locale: payload.locale,
    status: 'pending' as const,
    confirmToken: tokenHash,
    confirmExpiresAt: Timestamp.fromDate(expiresAt),
    gdprConsent: true,
    gdprConsentAt: now,
    lastSignupIpHash: ipHash,
    updatedAt: now,
  };

  if (snapshot.exists) {
    const currentStatus = (snapshot.get('status') as string | undefined)?.toLowerCase();
    const createdAt = snapshot.get('createdAt') ?? now;
    if (currentStatus === 'confirmed') {
      return { created: false, status: 'confirmed' };
    }
    await ref.set({ ...baseData, createdAt }, { merge: true });
    return { created: false, status: 'pending' };
  }

  await ref.set({ ...baseData, createdAt: now });
  return { created: true, status: 'pending' };
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rate = consumeRate(ip);
  if (!rate.allowed) {
    const retrySeconds = Math.ceil((rate.retryAfterMs ?? RATE_WINDOW_MS) / 1000);
    return NextResponse.json(
      { ok: false, code: 'rate_limited', message: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(retrySeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'invalid_json', 'Unable to parse request body.');
  }

  const parsed = waitlistPayloadSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues || [];
    const fields = Array.from(
      new Set(
        issues
          .map((issue) => {
            const path = issue.path.filter(Boolean).join('.');
            if (path) return path;
            const message = typeof issue.message === 'string' ? issue.message : '';
            const match = message.match(/[A-Za-z0-9_]+/);
            return match ? match[0] : '';
          })
      )
    ).filter(Boolean);
    const detail = fields.length
      ? `Invalid or missing waitlist fields: ${fields.join(', ')}.`
      : 'Invalid or missing waitlist fields.';
    return jsonError(400, 'invalid_payload', detail);
  }

  const payload = parsed.data;
  if (process.env.TEST_E2E_SHORTCIRCUIT === 'true' || isTestMode()) {
    const bypassToken = process.env.TEST_E2E_BYPASS_TOKEN || 'e2e-mocked-token';
    if (payload.captchaToken !== bypassToken) {
      return jsonError(429, 'captcha_failed', 'Captcha verification failed.');
    }
    return NextResponse.json({ ok: true, message: 'Confirmation email sent (short-circuit).' });
  }

  const docId = emailHash(payload.email.toLowerCase());
  const ipHashValue = hashIp(ip);

  await logAnalyticsEvent({
    name: 'waitlist_signup_submitted',
    data: {
      emailHash: docId,
      locale: payload.locale,
      ipHash: ipHashValue,
    },
  });

  const captchaResult = await verifyCaptcha(payload.captchaToken, ip);
  if (!captchaResult.success) {
    return jsonError(429, 'captcha_failed', 'Captcha verification failed.');
  }

  const { token, hash } = createConfirmToken();
  const expiresAt = new Date(Date.now() + getWaitlistConfirmTtlMs());

  let persistResult: PersistResult;
  try {
    persistResult = await persistWaitlist(docId, payload, hash, expiresAt, ipHashValue);
  } catch (error) {
    console.error('waitlist persist failed', error);
    return jsonError(500, 'storage_error', 'Failed to save waitlist entry.');
  }

  if (persistResult.status === 'confirmed') {
    return NextResponse.json({ ok: true, message: 'This email has already been confirmed.' });
  }

  const confirmUrl = buildConfirmUrl(token);

  try {
    const emailResult = await sendWaitlistConfirmEmail({ to: payload.email, confirmUrl });
    if (emailResult?.skipped) {
      console.info('[email:waitlist-confirm] skipped', {
        reason: emailResult.skipped,
        transport: emailResult.transport,
        to: payload.email,
      });
    }
  } catch (error) {
    console.error('waitlist confirmation email failed', error);
    await logAnalyticsEvent({
      name: 'waitlist_bounced',
      data: { emailHash: docId, locale: payload.locale, reason: error instanceof Error ? error.message : 'email_error' },
    });
  }

  await logAnalyticsEvent({
    name: 'waitlist_signup_accepted',
    data: {
      emailHash: docId,
      locale: payload.locale,
      ipHash: ipHashValue,
      created: persistResult.created,
    },
  });

  return NextResponse.json({ ok: true, message: 'Confirmation email sent.' });
}
