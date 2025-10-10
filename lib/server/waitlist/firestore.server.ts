import { randomUUID } from 'node:crypto';
import { getDb } from '@lib/firebaseAdmin';

export type WaitlistUtm = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

export type WaitlistDoc = {
  id: string;
  email: string;
  locale?: string | null;
  status: 'pending' | 'confirmed' | 'expired';
  confirmTokenHash?: string | null;
  confirmTokenLookupHash?: string | null;
  confirmSalt?: string | null;
  confirmExpiresAt?: Date | null;
  consent: {
    gdpr: boolean;
    at: Date | null;
  };
  utm?: WaitlistUtm | null;
  ref?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  confirmedAt?: Date | null;
};

export type WaitlistUpsertInput = {
  locale?: string | null;
  utm?: WaitlistUtm;
  ref?: string | null;
  consent: boolean;
  confirmExpiresAt: Date;
  confirmTokenHash: string;
  confirmTokenLookupHash: string;
  confirmSalt: string;
};

export type UpsertPendingResult = {
  created: boolean;
  status: 'pending' | 'confirmed' | 'expired';
  docId: string;
  locale?: string | null;
};

const COLLECTION = 'waitlist';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed) : null;
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    const result = value.toDate();
    return result instanceof Date ? result : null;
  }
  return null;
}

function mapUtm(value: unknown): WaitlistUtm | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const utm: WaitlistUtm = {};
  if (typeof record.source === 'string') utm.source = record.source;
  if (typeof record.medium === 'string') utm.medium = record.medium;
  if (typeof record.campaign === 'string') utm.campaign = record.campaign;
  if (typeof record.term === 'string') utm.term = record.term;
  if (typeof record.content === 'string') utm.content = record.content;
  return Object.keys(utm).length ? utm : null;
}

function mapDoc(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): WaitlistDoc {
  const data = doc.data() as Record<string, unknown> | undefined;
  const consentObj = (data?.consent as Record<string, unknown> | undefined) ?? {};
  const consentAt = consentObj.at ?? data?.consentAt ?? data?.gdprConsentAt;

  return {
    id: doc.id,
    email: typeof data?.email === 'string' ? data.email : '',
    locale: typeof data?.locale === 'string' ? data.locale : null,
    status: (typeof data?.status === 'string' ? data.status : 'pending') as WaitlistDoc['status'],
    confirmTokenHash: typeof data?.confirmTokenHash === 'string' ? data.confirmTokenHash : null,
    confirmTokenLookupHash: typeof data?.confirmTokenLookupHash === 'string' ? data.confirmTokenLookupHash : null,
    confirmSalt: typeof data?.confirmSalt === 'string' ? data.confirmSalt : null,
    confirmExpiresAt: toDate(data?.confirmExpiresAt),
    consent: {
      gdpr: Boolean(consentObj.gdpr ?? data?.gdprConsent ?? false),
      at: toDate(consentAt),
    },
    utm: mapUtm(data?.utm),
    ref: typeof data?.ref === 'string' ? data.ref : null,
    createdAt: toDate(data?.createdAt),
    updatedAt: toDate(data?.updatedAt),
    confirmedAt: toDate(data?.confirmedAt),
  };
}

async function findDocByField(field: string, value: string): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTION).where(field, '==', value).limit(1).get();
  if (snapshot.empty) return null;
  const [doc] = snapshot.docs;
  return doc ?? null;
}

export async function upsertPending(email: string, input: WaitlistUpsertInput): Promise<UpsertPendingResult> {
  const db = getDb();
  const collection = db.collection(COLLECTION);
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();
  const existingDoc = await findDocByField('emailNormalized', normalizedEmail);

  if (!existingDoc) {
    const docRef = collection.doc(randomUUID());
    await docRef.set({
      email: email.trim(),
      emailNormalized: normalizedEmail,
      locale: input.locale ?? null,
      ref: input.ref ?? null,
      utm: input.utm ?? null,
      status: 'pending',
      consent: {
        gdpr: Boolean(input.consent),
        at: now,
      },
      confirmTokenHash: input.confirmTokenHash,
      confirmTokenLookupHash: input.confirmTokenLookupHash,
      confirmSalt: input.confirmSalt,
      confirmExpiresAt: input.confirmExpiresAt,
      createdAt: now,
      updatedAt: now,
    });

    return {
      created: true,
      status: 'pending',
      docId: docRef.id,
      locale: input.locale ?? null,
    };
  }

  const data = existingDoc.data() as Record<string, unknown> | undefined;
  const currentStatus = (typeof data?.status === 'string' ? data.status : 'pending') as WaitlistDoc['status'];
  if (currentStatus === 'confirmed') {
    console.log('[GUARD][service]', { email, statusBefore: currentStatus });
    return {
      created: false,
      status: currentStatus,
      docId: existingDoc.id,
      locale: (typeof data?.locale === 'string' ? data.locale : null) ?? null,
    };
  }

  const updatePayload: Record<string, unknown> = {
    updatedAt: now,
  };

  if (input.locale) {
    updatePayload.locale = input.locale;
  }
  if (input.ref) {
    updatePayload.ref = input.ref;
  }
  if (input.utm) {
    updatePayload.utm = input.utm;
  }

  console.log('[WRITE][service][pending]', { email, statusBefore: currentStatus });
  updatePayload.status = 'pending';
  updatePayload.consent = {
    gdpr: Boolean(input.consent),
    at: now,
  };
  updatePayload.confirmTokenHash = input.confirmTokenHash;
  updatePayload.confirmTokenLookupHash = input.confirmTokenLookupHash;
  updatePayload.confirmSalt = input.confirmSalt;
  updatePayload.confirmExpiresAt = input.confirmExpiresAt;
  updatePayload.confirmedAt = null;

  await existingDoc.ref.set(updatePayload, { merge: true });

  const resolvedLocale =
    input.locale ??
    (typeof data?.locale === 'string' ? data.locale : null);

  return {
    created: false,
    status: 'pending',
    docId: existingDoc.id,
    locale: resolvedLocale ?? null,
  };
}

export async function findByEmail(email: string): Promise<WaitlistDoc | null> {
  const normalizedEmail = normalizeEmail(email);
  const doc = await findDocByField('emailNormalized', normalizedEmail);
  if (!doc) return null;
  return mapDoc(doc);
}

export async function findByTokenHash(tokenHash: string): Promise<WaitlistDoc | null> {
  const doc = await findDocByField('confirmTokenLookupHash', tokenHash);
  if (!doc) return null;
  return mapDoc(doc);
}

export async function markConfirmedByTokenHash(tokenHash: string): Promise<'confirmed' | 'already' | 'expired' | 'missing'> {
  const doc = await findDocByField('confirmTokenLookupHash', tokenHash);
  if (!doc) {
    return 'missing';
  }

  const data = doc.data() as Record<string, unknown> | undefined;
  const status = (typeof data?.status === 'string' ? data.status : 'pending') as WaitlistDoc['status'];

  if (status === 'confirmed') {
    return 'already';
  }
  if (status === 'expired') {
    return 'expired';
  }

  const now = new Date();

  await doc.ref.set(
    {
      status: 'confirmed',
      confirmedAt: now,
      confirmTokenHash: null,
      confirmTokenLookupHash: null,
      confirmSalt: null,
      confirmExpiresAt: null,
      updatedAt: now,
    },
    { merge: true }
  );

  return 'confirmed';
}

export async function markExpiredByTokenHash(tokenHash: string): Promise<'expired' | 'missing' | 'already'> {
  const doc = await findDocByField('confirmTokenLookupHash', tokenHash);
  if (!doc) {
    return 'missing';
  }

  const data = doc.data() as Record<string, unknown> | undefined;
  const status = (typeof data?.status === 'string' ? data.status : 'pending') as WaitlistDoc['status'];

  if (status === 'confirmed') {
    return 'already';
  }

  const now = new Date();

  await doc.ref.set(
    {
      status: 'expired',
      confirmTokenHash: null,
      confirmTokenLookupHash: null,
      confirmSalt: null,
      confirmExpiresAt: null,
      updatedAt: now,
    },
    { merge: true }
  );

  return 'expired';
}
