import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { initAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import type { WaitlistRecord } from '@/types/waitlist';
import { emailHash } from '@/lib/crypto/emailHash';
import { hashIp } from '@/lib/crypto/ipHash';

// --- Simple in-memory rate limit: 3 req / 60s per IP (per server instance) ---
type Bucket = { count: number; resetAt: number };
const rlGlobal = (globalThis as unknown as { __waitlistBuckets?: Map<string, Bucket> });
if (!rlGlobal.__waitlistBuckets) rlGlobal.__waitlistBuckets = new Map();
const BUCKETS = rlGlobal.__waitlistBuckets;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 3;

function getIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') || '';
  const ip = fwd.split(',')[0].trim() || 'unknown';
  return ip;
}

export async function GET() {
  try {
    const hasEnv = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    let canInit = false;
    if (hasEnv) {
      const app = initAdmin();
      const db = app.firestore();
      await db.listCollections();
      canInit = true;
    }
    return NextResponse.json({ ok: true, hasEnv, canInit });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('GET /api/waitlist error:', e);
    return NextResponse.json({ ok: false, error: message || 'health_error' }, { status: 500 });
  }
}

type WaitlistInput = {
  email: string;
  href?: string;
  referredBy?: string;
};

function parseUrlSafe(input?: string | null): URL | null {
  if (!input || typeof input !== 'string') return null;
  try { return new URL(input); } catch { return null; }
}

function parseUtm(u: URL | null) {
  if (!u) return null;
  const get = (k: string) => {
    const v = u.searchParams.get(k);
    return v ? v.trim() : undefined;
  };
  return {
    utm_source: get('utm_source'),
    utm_medium: get('utm_medium'),
    utm_campaign: get('utm_campaign'),
    utm_content: get('utm_content'),
    utm_term: get('utm_term'),
  };
}

function refCodeFromId(idHex: string) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const out: string[] = [];
  for (let i = 0; i < idHex.length && out.length < 8; i++) {
    const nib = parseInt(idHex[i], 16);
    out.push(alphabet[nib % alphabet.length]);
  }
  return out.join('');
}

export async function POST(req: Request) {
  try {
    // simple in-memory RL to avoid abuse
    const ip = getIp(req);
    const nowMs = Date.now();
    const b = BUCKETS.get(ip);
    if (!b || nowMs > b.resetAt) {
      BUCKETS.set(ip, { count: 1, resetAt: nowMs + RATE_WINDOW_MS });
    } else if (b.count >= RATE_MAX) {
      const retryAfterMs = Math.max(0, b.resetAt - nowMs);
      return NextResponse.json(
        { ok: false, error: 'rate_limited', retryAfterMs },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      );
    } else {
      b.count += 1;
    }

    const contentType = req.headers.get('content-type') || '';
    const raw = contentType.includes('application/json') ? await req.json() : {};

    // Enforce unified contract only
    let input: WaitlistInput | null = null;
    if (raw && typeof raw === 'object' && typeof raw.email === 'string') {
      input = {
        email: raw.email,
        href: typeof raw.href === 'string' ? raw.href : undefined,
        referredBy: typeof raw.referredBy === 'string' ? raw.referredBy : undefined,
      };
    }

    if (!input) {
      // Legacy-only payload detection: common old fields without email
      const hasLegacyFields = !!(
        raw && typeof raw === 'object' && (
          typeof (raw as any).path === 'string' ||
          typeof (raw as any).ref === 'string' ||
          typeof (raw as any).firstName === 'string' ||
          typeof (raw as any).country === 'string' ||
          typeof (raw as any).ageBand === 'string' ||
          typeof (raw as any).notes === 'string' ||
          typeof (raw as any).consent !== 'undefined' ||
          typeof (raw as any).website === 'string'
        )
      );
      if (hasLegacyFields) {
        return NextResponse.json({ ok: false, error: 'deprecated_payload' }, { status: 410 });
      }
      return NextResponse.json({ ok: false, error: 'email_required' }, { status: 400 });
    }

    const email = String(input.email).trim();
    const emailLc = email.toLowerCase();
    const docId = emailHash(emailLc);
    const refCode = refCodeFromId(docId);
    const href = typeof input.href === 'string' ? input.href : undefined;
    const referredBy = typeof input.referredBy === 'string' ? input.referredBy.toUpperCase() : undefined;
    const referrerHeader = req.headers.get('referer') || null;
    const refUrl = parseUrlSafe(referrerHeader || undefined);
    const hrefUrl = parseUrlSafe(href);
    const utm = parseUtm(hrefUrl);
    const ip_hash = hashIp(ip);
    const storeRawIp = typeof process.env.ANALYTICS_STORE_IP === 'string' && process.env.ANALYTICS_STORE_IP.trim().toLowerCase() === 'true';

    const app = initAdmin();
    const db = app.firestore();

    const userRef = db.collection('waitlist').doc(docId);
    const snap = await userRef.get();
    const now = FieldValue.serverTimestamp();

    const base: Partial<WaitlistRecord> = {
      email,
      emailLc,
      href: href || null,
      referrer: refUrl ? { host: refUrl.host, path: refUrl.pathname } : null,
      utm: utm || null,
      ip_hash: ip_hash || null,
      refCode,
      referredBy: referredBy || null,
      status: 'joined',
    };

    let created = false;
    if (snap.exists) {
      const prev = snap.data() as Partial<WaitlistRecord>;
      await userRef.set(
        {
          ...base,
          refCount: typeof prev.refCount === 'number' ? prev.refCount : 0,
          createdAt: prev.createdAt || now,
          updatedAt: now,
          // IP storage policy on update
          ...(storeRawIp ? { ip: ip } : { ip: FieldValue.delete() }),
        },
        { merge: true }
      );
    } else {
      created = true;
      await userRef.set({
        ...base,
        refCount: 0,
        createdAt: now,
        updatedAt: now,
        // IP storage policy on create
        ...(storeRawIp ? { ip } : {}),
      } as Partial<WaitlistRecord>);
    }

    // Ensure referral mapping exists
    const refMapRef = db.collection('waitlist_referrals').doc(refCode);
    const refMapSnap = await refMapRef.get();
    if (!refMapSnap.exists) {
      await refMapRef.set({ userId: docId, createdAt: now });
    }

    // Credit inviter on initial create only, if valid and not self
    if (created && referredBy && referredBy !== refCode) {
      const inviterMap = await db.collection('waitlist_referrals').doc(referredBy).get();
      if (inviterMap.exists) {
        const inviterId = String(inviterMap.get('userId') || '');
        if (inviterId && inviterId !== docId) {
          await db.collection('waitlist').doc(inviterId).set({ refCount: FieldValue.increment(1) }, { merge: true });
        }
      }
    }

    // Best-effort analytics event
    try {
      await db.collection('events').add({
        name: 'waitlist_submit',
        ok: true,
        emailLc,
        refCode,
        referredBy: referredBy || null,
        ip_hash: ip_hash || null,
        ...(storeRawIp ? { ip } : {}),
        createdAt: now,
        source: 'landing:v1',
      });
    } catch {}

    return NextResponse.json({ ok: true, code: refCode });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('POST /api/waitlist error:', e);
    return NextResponse.json({ ok: false, error: message || 'server_error' }, { status: 500 });
  }
}
