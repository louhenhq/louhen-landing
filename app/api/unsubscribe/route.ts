import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || '';
    if (!token) return html('Invalid link. Missing token.', 400);

    const app = initAdmin();
    const db = app.firestore();

    const snap = await db.collection('waitlist').where('unsubscribeToken', '==', token).limit(1).get();
    if (snap.empty) return html('This unsubscribe link is invalid or already used.', 404);

    const doc = snap.docs[0];
    const data = doc.data() as Record<string, unknown>;
    const expTs = (data?.unsubscribeTokenExpiresAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
    if (expTs && Date.now() > expTs) return html('This unsubscribe link has expired.', 410);
    if (data?.unsubscribed === true) return html('You are already unsubscribed. 👍');

    await doc.ref.update({
      unsubscribed: true,
      emailPrefs: { waitlistUpdates: false, referrals: false, launchNews: false },
      unsubscribeToken: null,
      unsubscribeTokenExpiresAt: null,
      unsubscribedAt: app.firestore.FieldValue.serverTimestamp(),
    });

    const site = process.env.NEXT_PUBLIC_SITE_URL || '/';
    return html(`You have been unsubscribed. <a href="${site}/unsubscribed" style="color:#0f172a;text-decoration:underline;">Return to site</a>`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Unsubscribe error', e);
    return html('Something went wrong. Please contact hello@louhen.com', 500);
  }
}

function html(body: string, status = 200) {
  const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe — Louhen</title></head><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;padding:24px;line-height:1.6"><h1 style="font-size:20px;margin:0 0 12px">Unsubscribe</h1><p>${body}</p></body></html>`;
  return new NextResponse(page, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

