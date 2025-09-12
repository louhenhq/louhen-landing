import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getDocByToken(token: string) {
  const app = initAdmin();
  const db = app.firestore();
  const snap = await db.collection('waitlist').where('unsubscribeToken', '==', token).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || '';
    if (!token) return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });

    const doc = await getDocByToken(token);
    if (!doc) return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 404 });

    const data = doc.data() as Record<string, unknown>;
    return NextResponse.json({
      ok: true,
      email: String(data.email ?? ''),
      unsubscribed: Boolean(data.unsubscribed),
      emailPrefs: {
        waitlistUpdates: Boolean((data as any)?.emailPrefs?.waitlistUpdates),
        referrals: Boolean((data as any)?.emailPrefs?.referrals),
        launchNews: Boolean((data as any)?.emailPrefs?.launchNews),
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Prefs GET error', e);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || '';
    if (!token) return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const prefs = (body as Record<string, unknown>)?.emailPrefs as Record<string, unknown> | undefined;
    const unsub = (body as Record<string, unknown>)?.unsubscribed as boolean | undefined;

    const doc = await getDocByToken(token);
    if (!doc) return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (typeof unsub === 'boolean') updates.unsubscribed = unsub;
    if (prefs && typeof prefs === 'object') {
      updates.emailPrefs = {
        waitlistUpdates: Boolean(prefs.waitlistUpdates),
        referrals: Boolean(prefs.referrals),
        launchNews: Boolean(prefs.launchNews),
      };
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: 'no_updates' }, { status: 400 });
    }

    await doc.ref.update(updates);
    return NextResponse.json({ ok: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Prefs POST error', e);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}

