// One-off cleanup script to remove raw IPs from waitlist docs.
// Usage:
//   # Using base64 service account (Vercel style)
//   export FIREBASE_SERVICE_ACCOUNT=$(base64 -i /path/to/sa.json | tr -d '\n')
//   npx tsx scripts/strip_ip_from_waitlist.ts
//
//   # Using raw JSON in env (no base64)
//   export FIREBASE_SERVICE_ACCOUNT="$(cat /path/to/sa.json)"
//   npx tsx scripts/strip_ip_from_waitlist.ts
//
//   # Using GOOGLE_APPLICATION_CREDENTIALS file path
//   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json
//   npx tsx scripts/strip_ip_from_waitlist.ts
//
// Options:
//   DRY_RUN=true               -> log what would change, but do not write
//   BATCH_SIZE=400             -> override commit batch size
//
// Notes:
// - Works whether FIREBASE_SERVICE_ACCOUNT is base64 or raw JSON.
// - Falls back to GOOGLE_APPLICATION_CREDENTIALS path.
// - Paginates through the collection to avoid loading everything at once.

import * as fs from "node:fs";
import * as path from "node:path";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, FieldPath } from "firebase-admin/firestore";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key?: string;
  [key: string]: unknown;
};

function loadCreds(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (raw) {
    // Try base64 first
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf8");
      return JSON.parse(decoded) as ServiceAccount;
    } catch {
      // Fallback: treat as raw JSON
      return JSON.parse(raw) as ServiceAccount;
    }
  }
  const gpath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gpath) {
    const p = path.resolve(gpath);
    if (!fs.existsSync(p)) {
      throw new Error(`GOOGLE_APPLICATION_CREDENTIALS file not found at: ${p}`);
    }
    return JSON.parse(fs.readFileSync(p, "utf8")) as ServiceAccount;
  }
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT (base64 or raw JSON) or GOOGLE_APPLICATION_CREDENTIALS path");
}

async function init() {
  const creds = loadCreds();
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: creds.project_id,
        clientEmail: creds.client_email,
        privateKey: creds.private_key?.replace(/\\n/g, "\n"),
      }),
    });
  }
  const db = getFirestore();
  // Be tolerant of any undefined we might accidentally send
  db.settings({ ignoreUndefinedProperties: true });
  return { db, projectId: creds.project_id as string };
}

async function main() {
  const { db, projectId } = await init();
  const dryRun = String(process.env.DRY_RUN || "").toLowerCase() === "true";
  const batchSize = Number(process.env.BATCH_SIZE || 400);

  let processed = 0;
  let updated = 0;
  let committed = 0;

  const col = db.collection("waitlist");

  // Paginate by document ID to avoid loading everything at once
  const pageLimit = 1000; // read page size (separate from write batch size)
  let last: FirebaseFirestore.QueryDocumentSnapshot | null = null;

   
  console.log(`[strip_ip] Project: ${projectId} | DRY_RUN=${dryRun} | BATCH_SIZE=${batchSize}`);

  while (true) {
    let q = col.orderBy(FieldPath.documentId()).limit(pageLimit);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;

    let batch = db.batch();
    let ops = 0;

    for (const doc of snap.docs) {
      processed += 1;
      const data = doc.data() as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(data, "ip")) {
        updated += 1;
        if (!dryRun) {
          batch.update(doc.ref, { ip: FieldValue.delete() });
        }
        ops += 1;
        if (ops >= batchSize) {
          if (!dryRun) await batch.commit();
          committed += ops;
          batch = db.batch();
          ops = 0;
        }
      }
    }

    if (ops > 0) {
      if (!dryRun) await batch.commit();
      committed += ops;
    }

    last = snap.docs[snap.docs.length - 1];

    // If we fetched less than a full page, we've reached the end
    if (snap.size < pageLimit) break;
  }

   
  console.log(`[strip_ip] Processed ${processed} docs; removed ip from ${updated} docs; committed ${committed} updates.`);
}

main().catch((e) => {
   
  console.error(e);
  process.exitCode = 1;
});
