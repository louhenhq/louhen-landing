import * as admin from 'firebase-admin';

export function initAdmin() {
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
export type Admin = typeof admin;
export { admin };

