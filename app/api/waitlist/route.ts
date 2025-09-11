import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import * as admin from 'firebase-admin';

function initAdmin() {
  if (admin.apps.length) return admin.app();
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT');
  const creds = JSON.parse(svc);
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: creds.project_id,
      clientEmail: creds.client_email,
      privateKey: creds.private_key?.replace(/\\n/g, '\n'),
    }),
  });
}

function makeReferralCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

// GET health check
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
  } catch (e: any) {
    console.error('GET /api/waitlist error:', e);
    return NextResponse.json({ ok: false, error: e?.message || 'health_error' }, { status: 500 });
  }
}

// POST to create waitlist entry
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, firstName, country, ageBand, ref, notes, consent } = body || {};
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

    await db.collection('waitlist').add({
      email, emailLc,
      firstName: firstName ?? null,
      country: country ?? null,
      ageBand: ageBand ?? null,
      referralInput: ref ?? null,
      notes: notes ?? null,
      referralCode: code,
      consentAt: now,
      createdAt: now,
      ua: null,
      ip: null,
      source: 'landing:v1'
    });

    return NextResponse.json({ ok: true, code });
  } catch (e: any) {
    console.error('POST /api/waitlist error:', e);
    return NextResponse.json({ ok: false, error: e?.message || 'server_error' }, { status: 500 });
  }
}