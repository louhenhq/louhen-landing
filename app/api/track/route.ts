import { NextRequest, NextResponse } from 'next/server';

/**
 * Minimal event capture.
 * If Firestore env is available, you can wire up Firestore writes (commented scaffold below).
 * Otherwise, this returns 200 OK and logs to server—keeps it safe & deployable immediately.
 */

// ---- Optional Firestore wiring (uncomment + add deps & envs to persist) ----
// import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
// import { getFirestore } from 'firebase-admin/firestore';
// let db: ReturnType<typeof getFirestore> | null = null;
// function ensureDb() {
//   if (db) return db;
//   const projectId = process.env.FIREBASE_PROJECT_ID;
//   const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
//   const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n');
//   if (!projectId || !clientEmail || !privateKey) return null;
//   initializeApp({ credential: cert({ projectId, clientEmail, privateKey } as ServiceAccount) });
//   db = getFirestore();
//   return db;
// }

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);
  if (!data || typeof data.name !== 'string') {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  // Safe log for now
  console.log('[track]', {
    name: data.name,
    path: data.path,
    id: data.id,
    ok: data.ok,
    error: data.error,
    variant: data.variant,
    ts: data.ts,
  });

  // ---- Optional Firestore persist ----
  // const store = ensureDb();
  // if (store) {
  //   await store.collection('events').add({
  //     ...data,
  //     ts: data.ts ?? Date.now(),
  //     ip: req.ip ?? null,
  //   });
  // }

  return NextResponse.json({ ok: true });
}

