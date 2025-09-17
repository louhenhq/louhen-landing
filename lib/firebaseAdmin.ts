import * as admin from 'firebase-admin';

let configured = false;
export function initAdmin() {
  if (!admin.apps.length) {
    const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!svc) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT');
    const creds = JSON.parse(svc);
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: creds.project_id,
        clientEmail: creds.client_email,
        privateKey: creds.private_key?.replace(/\\n/g, '\n'),
      }),
    });
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
