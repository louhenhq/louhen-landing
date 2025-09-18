import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { emailHash } from '@/lib/crypto/emailHash';
import { randomTokenBase64Url, sha256Hex } from '@/lib/crypto/token';
import { sendWaitlistConfirmEmail } from '@/lib/email/send';
import { getWaitlistConfirmTtlMs } from '@/lib/waitlistConfirmTtl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === 'string' ? String(body.email).trim() : '';
    if (!email) return NextResponse.json({ ok: false }, { status: 200 });
    const emailLc = email.toLowerCase();
    const id = emailHash(emailLc);
    const app = initAdmin();
    const db = app.firestore();
    const ref = db.collection('waitlist').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ ok: true });
    const data = snap.data() as Record<string, any>;
    if (data.confirmedAt) return NextResponse.json({ ok: true });

    const ttlMs = getWaitlistConfirmTtlMs();
    const token = randomTokenBase64Url(32);
    const tokenHash = sha256Hex(token);
    const expDate = new Date(Date.now() + ttlMs);
    await ref.set(
      { confirmTokenHash: tokenHash, confirmSentAt: FieldValue.serverTimestamp(), confirmExpiresAt: Timestamp.fromDate(expDate) },
      { merge: true }
    );
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://louhen-landing.vercel.app';
    const confirmUrl = new URL('/api/waitlist/confirm', baseUrl);
    confirmUrl.searchParams.set('token', token);
    await sendWaitlistConfirmEmail({ to: email, confirmUrl: confirmUrl.toString() });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('resend-confirm error', e);
    return NextResponse.json({ ok: true });
  }
}
