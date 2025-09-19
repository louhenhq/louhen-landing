import * as admin from 'firebase-admin';

let configured = false;

function decodeServiceAccount(): Record<string, unknown> {
  const b64 = process.env.FIREBASE_ADMIN_SA_B64;
  const legacyJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (b64 && b64.trim()) {
    try {
      const raw = Buffer.from(b64.trim(), 'base64').toString('utf8');
      return JSON.parse(raw);
    } catch (error) {
      throw new Error('Invalid FIREBASE_ADMIN_SA_B64 payload');
    }
  }

  if (legacyJson && legacyJson.trim()) {
    try {
      return JSON.parse(legacyJson);
    } catch (error) {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT payload');
    }
  }

  throw new Error('Missing FIREBASE_ADMIN_SA_B64');
}

export function initAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    if (!projectId) {
      throw new Error('Missing FIREBASE_PROJECT_ID');
    }

    const serviceAccount = decodeServiceAccount() as Record<string, any>;
    const clientEmail = serviceAccount.client_email || process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = serviceAccount.private_key || process.env.FIREBASE_PRIVATE_KEY;
    if (!clientEmail || !privateKeyRaw) {
      throw new Error('Incomplete Firebase service account credentials');
    }

    const privateKey = String(privateKeyRaw).replace(/\\n/g, '\n');

    const options: admin.AppOptions = {
      credential: admin.credential.cert({
        projectId,
        clientEmail: String(clientEmail),
        privateKey,
      }),
      projectId,
    };

    const region = process.env.FIREBASE_DB_REGION?.trim();
    if (region) {
      options.databaseURL = `https://${projectId}-${region}.firebaseio.com`;
    }

    admin.initializeApp(options);
  }

  const app = admin.app();
  if (!configured) {
    // Ignore undefined properties globally to avoid Firestore write errors
    admin.firestore().settings({ ignoreUndefinedProperties: true });
    configured = true;
  }
  return app;
}

export type Admin = typeof admin;
export { admin };
