import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/firebaseAdmin';

export type WaitlistUtm = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

export type PreOnboardingChildDraft = {
  name: string;
  birthday: string;
  weight?: number | null;
  shoeSize?: string | null;
};

export type PreOnboardingDraft = {
  parentFirstName?: string | null;
  children: PreOnboardingChildDraft[];
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
  preOnboarded?: boolean;
  profileDraft?: PreOnboardingDraft | null;
  profileDraftUpdatedAt?: Date | null;
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
  const profileDraft = mapProfileDraft(data?.profileDraft);

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
    preOnboarded: Boolean(data?.preOnboarded),
    profileDraft,
    profileDraftUpdatedAt: toDate(data?.profileDraftUpdatedAt),
  };
}

function mapProfileDraft(value: unknown): PreOnboardingDraft | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const parentFirstName = typeof record.parentFirstName === 'string' && record.parentFirstName.trim() ? record.parentFirstName : null;
  const childrenRaw = Array.isArray(record.children) ? record.children : [];
  const children: PreOnboardingChildDraft[] = [];

  for (const child of childrenRaw) {
    if (!child || typeof child !== 'object') continue;
    const childRecord = child as Record<string, unknown>;
    const name = typeof childRecord.name === 'string' ? childRecord.name : null;
    const birthday = typeof childRecord.birthday === 'string' ? childRecord.birthday : null;
    if (!name || !birthday) continue;
    const weightValue = typeof childRecord.weight === 'number' ? childRecord.weight : null;
    const shoeSizeValue = typeof childRecord.shoeSize === 'string' ? childRecord.shoeSize : null;
    children.push({ name, birthday, weight: weightValue, shoeSize: shoeSizeValue });
  }

  if (!children.length) return null;

  return {
    parentFirstName,
    children,
  };
}

async function findDocByField(field: string, value: string): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTION).where(field, '==', value).limit(1).get();
  if (snapshot.empty) return null;
  return snapshot.docs[0];
}

async function findDocById(docId: string): Promise<FirebaseFirestore.DocumentSnapshot | null> {
  if (!docId) return null;
  const db = getDb();
  const ref = db.collection(COLLECTION).doc(docId);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  return snapshot;
}

async function resolveDocSnapshot(identifier: string): Promise<FirebaseFirestore.DocumentSnapshot | FirebaseFirestore.QueryDocumentSnapshot | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const byId = await findDocById(trimmed);
  if (byId) return byId;

  const normalizedEmail = normalizeEmail(trimmed);
  return findDocByField('emailNormalized', normalizedEmail);
}

export async function upsertPending(email: string, input: WaitlistUpsertInput): Promise<UpsertPendingResult> {
  const db = getDb();
  const collection = db.collection(COLLECTION);
  const normalizedEmail = normalizeEmail(email);
  const existingDoc = await findDocByField('emailNormalized', normalizedEmail);
  const now = new Date();

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
  const shouldUpdateToken = currentStatus !== 'confirmed';

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

  if (shouldUpdateToken) {
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
  }

  await existingDoc.ref.set(updatePayload, { merge: true });

  return {
    created: false,
    status: shouldUpdateToken ? 'pending' : currentStatus,
    docId: existingDoc.id,
    locale: (input.locale ?? data?.locale ?? null) as string | null | undefined,
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

function sanitizePreOnboardingDraft(input: PreOnboardingDraft): PreOnboardingDraft | null {
  if (!input || !Array.isArray(input.children)) {
    return null;
  }

  const parentFirstName = typeof input.parentFirstName === 'string' && input.parentFirstName.trim() ? input.parentFirstName.trim() : null;
  const children: PreOnboardingChildDraft[] = [];

  for (const child of input.children) {
    if (!child) continue;
    const name = typeof child.name === 'string' ? child.name.trim() : '';
    const birthday = typeof child.birthday === 'string' ? child.birthday.trim() : '';
    if (!name || !birthday) {
      continue;
    }
    const weight = typeof child.weight === 'number' && Number.isFinite(child.weight) ? Number(child.weight) : null;
    const shoeSize = typeof child.shoeSize === 'string' && child.shoeSize.trim() ? child.shoeSize.trim() : null;
    children.push({
      name,
      birthday,
      ...(weight !== null ? { weight } : {}),
      ...(shoeSize ? { shoeSize } : {}),
    });
  }

  if (!children.length) {
    return null;
  }

  return {
    parentFirstName,
    children,
  };
}

export async function savePreOnboardingDraft(identifier: string, draft: PreOnboardingDraft): Promise<void> {
  const snapshot = await resolveDocSnapshot(identifier);
  if (!snapshot) {
    return;
  }

  const sanitized = sanitizePreOnboardingDraft(draft);
  if (!sanitized) {
    return;
  }

  const now = new Date();
  const profileDraftPayload: Record<string, unknown> = {
    children: sanitized.children.map((child) => {
      const childPayload: Record<string, unknown> = {
        name: child.name,
        birthday: child.birthday,
      };
      if (typeof child.weight === 'number') {
        childPayload.weight = child.weight;
      }
      if (child.shoeSize) {
        childPayload.shoeSize = child.shoeSize;
      }
      return childPayload;
    }),
  };

  if (sanitized.parentFirstName) {
    profileDraftPayload.parentFirstName = sanitized.parentFirstName;
  }

  await snapshot.ref.set(
    {
      preOnboarded: true,
      profileDraft: profileDraftPayload,
      profileDraftUpdatedAt: now,
      updatedAt: now,
    },
    { merge: true }
  );
}

export async function hasPreOnboarded(identifier: string): Promise<boolean> {
  const snapshot = await resolveDocSnapshot(identifier);
  if (!snapshot) {
    return false;
  }
  const data = snapshot.data() as Record<string, unknown> | undefined;
  return Boolean(data?.preOnboarded);
}

export async function getPreOnboardingDraft(identifier: string): Promise<PreOnboardingDraft | null> {
  const snapshot = await resolveDocSnapshot(identifier);
  if (!snapshot) {
    return null;
  }
  const data = snapshot.data() as Record<string, unknown> | undefined;
  return mapProfileDraft(data?.profileDraft) ?? null;
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
