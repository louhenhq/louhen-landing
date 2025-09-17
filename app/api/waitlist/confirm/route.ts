import { NextResponse, NextRequest } from 'next/server';
import { initAdmin } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { sha256Hex } from '@/lib/crypto/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || '';
    if (!token || token.length < 20) {
      return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 400 });
    }
    const hash = sha256Hex(token);
    const app = initAdmin();
    const db = app.firestore();
    const snap = await db.collection('waitlist').where('confirmTokenHash', '==', hash).limit(1).get();
    if (snap.empty) {
      return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 400 });
    }
    const doc = snap.docs[0];
    const data = doc.data() as Record<string, any>;

    // Already confirmed
    if (data.confirmedAt) {
      const base = process.env.NEXT_PUBLIC_SITE_URL || '/';
      const url = new URL('/thanks', base);
      url.searchParams.set('code', String(data.refCode || ''));
      url.searchParams.set('confirmed', '1');
      return NextResponse.redirect(url.toString(), 302);
    }

    // Expired?
    const exp = data.confirmExpiresAt?.toMillis?.() as number | undefined;
    if (exp && Date.now() > exp) {
      return NextResponse.json({ ok: false, error: 'expired' }, { status: 410 });
    }

    await doc.ref.set(
      {
        status: 'confirmed',
        confirmedAt: FieldValue.serverTimestamp(),
        confirmTokenHash: null,
        confirmExpiresAt: null,
      },
      { merge: true }
    );

    const base = process.env.NEXT_PUBLIC_SITE_URL || '/';
    const url = new URL('/thanks', base);
    url.searchParams.set('code', String(data.refCode || ''));
    url.searchParams.set('confirmed', '1');
    return NextResponse.redirect(url.toString(), 302);
  } catch (e) {
    console.error('confirm handler error', e);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}

