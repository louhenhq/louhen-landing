import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { initAdmin, admin } from '@/lib/firebaseAdmin';
import { Resend } from 'resend';

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

    // --- Send welcome email with referral link (best-effort, toggle with EMAIL_ENABLED) ---
    try {
      const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (EMAIL_ENABLED && RESEND_API_KEY) {
        const resend = new Resend(RESEND_API_KEY);
        const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://louhen-landing.vercel.app';
        const codeUpper = String(code).toUpperCase();
        const url = new URL(`/r/${codeUpper}`, base);
        url.searchParams.set('utm_source', 'referral');
        url.searchParams.set('utm_medium', 'waitlist');
        url.searchParams.set('utm_campaign', 'prelaunch');
        url.searchParams.set('utm_content', codeUpper);
        const referralLink = url.toString();

        const from = process.env.RESEND_FROM || 'Louhen <hello@louhen.com>';
        const to = String(email);
        const first = (firstName && String(firstName).trim()) || '';

        const subject = 'Welcome to Louhen 👟 Your referral link inside';
        const preview = `Here’s your personal invite link: ${referralLink}`;
        const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ffffff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;padding:24px;">
      <tr><td style="font-size:0;line-height:0;height:8px;">&zwnj;</td></tr>
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:28px;height:28px;border-radius:8px;background:#0f172a;display:inline-block;"></div>
            <div style="font-weight:700;">Louhen</div>
          </div>
          <h1 style="margin:20px 0 8px;font-size:20px;">Welcome${first ? `, ${first}` : ''}!</h1>
          <p style="margin:0 0 16px;line-height:1.6;">
            Thanks for joining Louhen. Here’s your personal invite link — share it with friends and you’ll both earn credit when they place their first order:
          </p>
          <p style="margin:0 0 16px;">
            <a href="${referralLink}" style="color:#0f172a;text-decoration:underline;word-break:break-all;">${referralLink}</a>
          </p>
          <p style="margin:0 0 16px;line-height:1.6;">
            Your referral code: <strong>${codeUpper}</strong>
          </p>
          <p style="margin:16px 0 0;color:#475569;font-size:12px;line-height:1.6;">
            You’re receiving this because you joined the Louhen waitlist. If this wasn’t you, simply ignore this email or contact us at hello@louhen.com.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

        await resend.emails.send({
          from,
          to,
          subject,
          headers: { 'X-Entity-Ref-ID': newDocRef.id, 'X-Preheader': preview },
          html,
        });
      } else {
        // eslint-disable-next-line no-console
        console.warn('Email sending skipped (EMAIL_ENABLED not true or RESEND_API_KEY missing).');
      }
    } catch (mailErr) {
      // eslint-disable-next-line no-console
      console.error('Resend email send failed:', mailErr);
    }

    return NextResponse.json({ ok: true, code, refAccepted });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('POST /api/waitlist error:', e);
    return NextResponse.json({ ok: false, error: message || 'server_error' }, { status: 500 });
  }
}
