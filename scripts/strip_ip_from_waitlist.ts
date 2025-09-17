// One-off cleanup script to remove raw IPs from waitlist docs.
// Usage: ts-node scripts/strip_ip_from_waitlist.ts
// Requires FIREBASE_SERVICE_ACCOUNT in env.

import * as admin from 'firebase-admin';

async function init() {
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT');
  const creds = JSON.parse(svc);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: creds.project_id,
        clientEmail: creds.client_email,
        privateKey: creds.private_key?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin.firestore();
}

async function main() {
  const db = await init();
  const col = db.collection('waitlist');
  let processed = 0;
  let updated = 0;

  const snap = await col.get();
  const batchSize = 400;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    processed += 1;
    const data = doc.data() as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(data, 'ip')) {
      batch.update(doc.ref, { ip: admin.firestore.FieldValue.delete() });
      updated += 1;
      ops += 1;
      if (ops >= batchSize) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  // eslint-disable-next-line no-console
  console.log(`Processed ${processed} docs; removed ip from ${updated} docs.`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});
