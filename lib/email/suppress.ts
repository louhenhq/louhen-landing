import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';

import { initAdmin } from '@/lib/firebaseAdmin';
import { isTestMode } from '@/lib/testMode';

export type SuppressionScope = 'transactional' | 'marketing' | 'all';

export type SuppressionRecord = {
  emailHash: string;
  scope: SuppressionScope;
  source?: string;
  reason?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function getSalt(): string {
  const raw = process.env.SUPPRESSION_SALT?.trim();
  if (isTestMode()) {
    return raw && raw.length > 0 ? raw : 'test-mode-salt';
  }
  if (!raw) {
    throw new Error('Missing SUPPRESSION_SALT');
  }
  return raw;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashEmail(email: string): string {
  const normalized = normalizeEmail(email);
  return createHash('sha256').update(`${normalized}:${getSalt()}`).digest('hex');
}

function mapScope(value?: string): SuppressionScope {
  if (value === 'transactional' || value === 'marketing' || value === 'all') {
    return value;
  }
  return 'all';
}

const COLLECTION = 'suppressions';
const MEMORY_SUPPRESSIONS = new Map<string, SuppressionRecord>();

export async function isSuppressed(email: string, scope: SuppressionScope): Promise<{ suppressed: boolean; record?: SuppressionRecord }>
{
  if (isTestMode()) {
    const emailHash = hashEmail(email);
    const record = MEMORY_SUPPRESSIONS.get(emailHash);
    if (!record) {
      return { suppressed: false };
    }
    const suppressed = record.scope === 'all' || record.scope === scope;
    return { suppressed, record };
  }
  const db = initAdmin().firestore();
  const emailHash = hashEmail(email);
  const doc = await db.collection(COLLECTION).doc(emailHash).get();
  if (!doc.exists) {
    return { suppressed: false };
  }
  const data = doc.data() ?? {};
  const recordScope = mapScope(data.scope as string | undefined);
  const suppressed = recordScope === 'all' || recordScope === scope;
  const record: SuppressionRecord = {
    emailHash,
    scope: recordScope,
    source: data.source as string | undefined,
    reason: data.reason as string | undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
  return { suppressed, record };
}

type UpsertInput = {
  email: string;
  scope: SuppressionScope;
  source?: string;
  reason?: string;
};

export async function upsertSuppression({ email, scope, source, reason }: UpsertInput): Promise<SuppressionRecord> {
  if (isTestMode()) {
    const emailHash = hashEmail(email);
    const record: SuppressionRecord = {
      emailHash,
      scope,
      source,
      reason,
    };
    MEMORY_SUPPRESSIONS.set(emailHash, record);
    return record;
  }
  const db = initAdmin().firestore();
  const emailHash = hashEmail(email);
  const ref = db.collection(COLLECTION).doc(emailHash);
  const now = FieldValue.serverTimestamp();
  const update = {
    scope,
    source: source ?? null,
    reason: reason ?? null,
    updatedAt: now,
  };

  await ref.set(
    {
      emailHash,
      ...update,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    emailHash,
    scope,
    source,
    reason,
  };
}

type ShouldSendArgs = {
  email: string;
  scope: SuppressionScope;
};

export async function shouldSend({ email, scope }: ShouldSendArgs): Promise<{ allowed: boolean; record?: SuppressionRecord }>
{
  const result = await isSuppressed(email, scope);
  return { allowed: !result.suppressed, record: result.record };
}
