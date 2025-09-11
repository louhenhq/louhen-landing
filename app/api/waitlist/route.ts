import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { initAdmin, admin } from '@/lib/firebaseAdmin';

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

// (init moved to lib/firebaseAdmin)

function makeReferralCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
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

export async function POST(req: Request) {
  try {
    const ip = getIp(req);
    const ua = req.headers.get('user-agent') || null;
    const nowMs = Date.now();
    const b = BUCKETS.get(ip);
    if (!b || nowMs > b.resetAt) {
      BUCKETS.set(ip, { count: 1, resetAt: nowMs + RATE_WINDOW_MS });
    } else {
      if (b.count >= RATE_MAX) {
        const retryAfterMs = Math.max(0, b.resetAt - nowMs);
        return NextResponse.json(
          { ok: false, error: 'rate_limited', retryAfterMs },
          { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
        );
      }
      b.count += 1;
    }

    const body = await req.json();
    const { email, firstName, country, ageBand, ref, notes, consent, website } = body || {};

    // Honeypot trap: bots fill hidden "website" field -> silently accept but do nothing
    if (website && String(website).trim() !== '') {
      return NextResponse.json({ ok: true, queued: true });
    }
    if (!email || !consent) {
      return NextResponse.json({ ok: false, error: 'email_and_consent_required' }, { status: 400 });
    }

    const app = initAdmin();
    const db = app.firestore();
    const emailLc = String(email).trim().toLowerCase();

    const exists = await db.collection('waitlist').where('emailLc','==',emailLc).limit(1).get();
    if (!exists.empty) return NextResponse.json({ ok: true, dupe: true });

    const code = makeReferralCode();
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Resolve referrer (optional)
    let refAccepted = false;
    let referrerId: string | null = null;
    let refCode = typeof ref === 'string' ? ref.trim().toUpperCase() : null;
    if (refCode) {
      const snap = await db.collection('waitlist').where('referralCode', '==', refCode).limit(1).get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        referrerId = doc.id;
        // Prevent self-referral by comparing emails (best-effort)
        const refEmailLc = (doc.get('emailLc') as string | undefined) || undefined;
        if (refEmailLc && refEmailLc === emailLc) {
          refAccepted = false;
          refCode = null;
          referrerId = null;
        } else {
          refAccepted = true;
        }
      } else {
        // Unknown code: ignore silently
        refCode = null;
      }
    }

    const newDocRef = await db.collection('waitlist').add({
      email, emailLc,
      firstName: firstName ?? null,
      country: country ?? null,
      ageBand: ageBand ?? null,
      referralInput: refCode ?? null,
      referredById: refAccepted ? referrerId : null,
      notes: notes ?? null,
      referralCode: code,
      referralCount: 0,
      consentAt: now,
      createdAt: now,
      ua,
      ip,
      source: 'landing:v1'
    });

    if (refAccepted && referrerId) {
      const referrerRef = db.collection('waitlist').doc(referrerId);
      await referrerRef.update({ referralCount: admin.firestore.FieldValue.increment(1) });
      await db.collection('referralEvents').add({
        type: 'signup_credit',
        referrerId,
        refereeId: newDocRef.id,
        code: refCode,
        createdAt: now,
        ua,
        ip,
        source: 'landing:v1'
      });
    }

    return NextResponse.json({ ok: true, code, refAccepted });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('POST /api/waitlist error:', e);
    return NextResponse.json({ ok: false, error: message || 'server_error' }, { status: 500 });
  }
}
