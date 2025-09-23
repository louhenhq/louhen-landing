import 'server-only';

import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebaseAdmin';
import type { EmailPrefs, WaitlistDoc } from '@/types/waitlist';

// (types now imported)

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

    const raw = doc.data() as FirebaseFirestore.DocumentData;
    const data: Partial<WaitlistDoc> = {
      email: String(raw.email),
      unsubscribed: Boolean(raw.unsubscribed),
      emailPrefs: {
        waitlistUpdates: Boolean(raw?.emailPrefs?.waitlistUpdates),
        referrals: Boolean(raw?.emailPrefs?.referrals),
        launchNews: Boolean(raw?.emailPrefs?.launchNews),
      },
    };
    return NextResponse.json({
      ok: true,
      email: data.email,
      unsubscribed: Boolean(data.unsubscribed),
      emailPrefs: {
        waitlistUpdates: Boolean(data.emailPrefs?.waitlistUpdates),
        referrals: Boolean(data.emailPrefs?.referrals),
        launchNews: Boolean(data.emailPrefs?.launchNews),
      },
    });
  } catch (e) {
    console.error('Prefs GET error', e);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token') || '';
    if (!token) return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });

    type UpdateBody = { unsubscribed?: boolean; emailPrefs?: Partial<EmailPrefs> };
    const body = (await req.json().catch(() => ({}))) as UpdateBody;
    const prefs = body.emailPrefs;
    const unsub = body.unsubscribed;

    const doc = await getDocByToken(token);
    if (!doc) return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (typeof unsub === 'boolean') updates.unsubscribed = unsub;
    if (prefs && typeof prefs === 'object') {
      updates.emailPrefs = {
        waitlistUpdates: Boolean(prefs.waitlistUpdates),
        referrals: Boolean(prefs.referrals),
        launchNews: Boolean(prefs.launchNews),
      } as EmailPrefs;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: 'no_updates' }, { status: 400 });
    }

    await doc.ref.update(updates);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Prefs POST error', e);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
