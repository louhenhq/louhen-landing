import { Buffer } from 'node:buffer';
import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

type DecodedServiceAccount = ServiceAccount & {
  private_key?: string;
};

function decodeServiceAccount(): DecodedServiceAccount | null {
  const b64 = process.env.FIREBASE_ADMIN_SA_B64;
  if (b64 && b64.trim()) {
    const raw = Buffer.from(b64.trim(), 'base64').toString('utf8');
    return JSON.parse(raw) as DecodedServiceAccount;
  }

  const legacyJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (legacyJson && legacyJson.trim()) {
    return JSON.parse(legacyJson) as DecodedServiceAccount;
  }

  return null;
}

let firestoreInstance: Firestore | null = null;

function ensureAppInitialized() {
  if (firestoreInstance) return;

  const serviceAccount = decodeServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!serviceAccount || !projectId) {
    throw new Error('Firebase Admin credentials are not configured.');
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  }

  const firestore = getFirestore();
  firestore.settings({ ignoreUndefinedProperties: true });
  firestoreInstance = firestore;
}

export function initAdmin(): typeof admin {
  ensureAppInitialized();
  return admin;
}

export function getDb(): Firestore {
  ensureAppInitialized();
  return firestoreInstance as Firestore;
}

export { admin };
