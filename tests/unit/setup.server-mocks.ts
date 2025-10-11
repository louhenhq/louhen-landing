import { vi } from 'vitest';

vi.mock('firebase-admin/app', () => {
  return {
    cert: vi.fn(() => ({})),
    getApps: vi.fn(() => []),
    initializeApp: vi.fn(() => ({})),
  };
});

vi.mock('firebase-admin/firestore', () => {
  const FieldValue = {
    serverTimestamp: vi.fn(() => new Date()),
  };

  class Timestamp {
    constructor(public seconds = 0, public nanoseconds = 0) {}
    static fromDate(date: Date) {
      return new Timestamp(Math.floor(date.getTime() / 1000), 0);
    }
    toDate() {
      return new Date();
    }
  }

  const collection = vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn(async () => ({ exists: false, data: () => ({}) })),
      set: vi.fn(async () => {}),
      update: vi.fn(async () => {}),
    })),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn(async () => ({ size: 0, docs: [] })),
  }));

  const firestoreInstance = {
    settings: vi.fn(),
    collection,
    doc: vi.fn(),
  };

  return {
    getFirestore: vi.fn(() => firestoreInstance),
    FieldValue,
    Timestamp,
  };
});

vi.mock('firebase-admin', () => {
  const auth = vi.fn(() => ({
    verifyIdToken: vi.fn(async () => ({ uid: 'mock-user' })),
  }));
  const firestore = vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(async () => ({ exists: false, data: () => ({}) })),
        set: vi.fn(async () => {}),
      })),
    })),
  }));
  return {
    auth,
    firestore,
  };
});

vi.mock('nodemailer', () => {
  return {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(async () => ({ messageId: 'mocked-message' })),
    })),
  };
});
