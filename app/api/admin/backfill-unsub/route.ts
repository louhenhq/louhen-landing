import { NextResponse } from 'next/server';
import { initAdmin, admin } from '@/lib/firebaseAdmin';
import { generateUnsubToken } from '@/lib/unsubTokens';

export const runtime = 'nodejs';

type WaitlistDoc = {
  email?: string;
  unsubscribeToken?: string | null;
  unsubscribeTokenExpiresAt?: admin.firestore.Timestamp | null;
};

export async function GET(req: Request) {
  // Gate by ADMIN_KEY
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || '';
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const dry = (url.searchParams.get('dry') ?? '1') !== '0'; // default dry-run=on
  const pageSize = Math.min(Number(url.searchParams.get('limit') ?? '100'), 500);
  const startAfter = url.searchParams.get('cursor') ?? undefined;

  initAdmin();
  const db = admin.firestore();

  let q = db.collection('waitlist')
    .where('unsubscribeToken', 'in', [null, ''])
    .orderBy(admin.firestore.FieldPath.documentId())
    .limit(pageSize);

  if (startAfter) q = q.startAfter(startAfter);

  const snap = await q.get();
  const updates: Array<{id: string, email?: string, token: string}> = [];

  const batch = db.batch();
  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  );

  snap.forEach(doc => {
    const data = (doc.data() as WaitlistDoc) ?? {};
    const token = generateUnsubToken();
    updates.push({ id: doc.id, email: data.email, token });
    if (!dry) {
      batch.update(doc.ref, {
        unsubscribeToken: token,
        unsubscribeTokenExpiresAt: expiresAt,
      });
    }
  });

  if (!dry && updates.length) {
    await batch.commit();
  }

  const nextCursor = snap.size === pageSize ? snap.docs[snap.docs.length - 1].id : null;
  return NextResponse.json({
    ok: true,
    dryRun: dry,
    processed: updates.length,
    nextCursor,
    samples: updates.slice(0, 5),
  });
}

