import 'server-only';
import { createHmac } from 'crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getDb, initAdmin } from '@/lib/firebaseAdmin';
import { isTestMode } from '@/lib/testMode';
import type { RateLimitRule } from '@/lib/rate/rules';

const COLLECTION = 'waitlist_rate';

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterMs: number;
  retryAfterSeconds: number;
};

type WindowDescriptor = {
  bucketSuffix: string;
  expiresAtMs: number;
};

type MemoryEntry = {
  count: number;
  expiresAtMs: number;
};

const memoryStore = new Map<string, MemoryEntry>();
let cachedHashSecret: string | null = null;

function getHashSecret(): string {
  if (cachedHashSecret) {
    return cachedHashSecret;
  }
  const candidates = [process.env.WAITLIST_RATE_HASH_SECRET, process.env.HCAPTCHA_SECRET, process.env.RESEND_API_KEY];
  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      cachedHashSecret = candidate.trim();
      return cachedHashSecret;
    }
  }
  cachedHashSecret = 'louhen-waitlist-rate-dev-secret';
  return cachedHashSecret;
}

function hashIdentifier(scope: RateLimitRule['scope'], value: string): string {
  const secret = getHashSecret();
  const hmac = createHmac('sha256', secret);
  hmac.update(scope);
  hmac.update(':');
  hmac.update(value);
  return hmac.digest('hex');
}

function normalizeIdentifier(rule: RateLimitRule, identifier: string): string {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return 'anonymous';
  }
  if (rule.scope === 'email') {
    return trimmed.toLowerCase();
  }
  return trimmed;
}

function formatWindow(rule: RateLimitRule, nowMs: number): WindowDescriptor {
  const windowStartMs = Math.floor(nowMs / rule.windowMs) * rule.windowMs;
  const windowEndMs = windowStartMs + rule.windowMs;
  const frame = new Date(windowStartMs);
  const year = frame.getUTCFullYear().toString();
  const month = (frame.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = frame.getUTCDate().toString().padStart(2, '0');
  const hour = frame.getUTCHours().toString().padStart(2, '0');

  if (rule.scope === 'ip') {
    return { bucketSuffix: `${year}${month}${day}${hour}`, expiresAtMs: windowEndMs };
  }

  const minute = frame.getUTCMinutes();
  const chunk = Math.floor(minute / 30) * 30;
  const minuteChunk = chunk.toString().padStart(2, '0');
  return { bucketSuffix: `${year}${month}${day}${hour}${minuteChunk}`, expiresAtMs: windowEndMs };
}

function readExpiresAtMs(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) {
    return value.getTime();
  }
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as { toMillis?: () => number; toDate?: () => Date };
    if (typeof maybeTimestamp.toMillis === 'function') {
      const millis = maybeTimestamp.toMillis();
      if (Number.isFinite(millis)) {
        return millis;
      }
    }
    if (typeof maybeTimestamp.toDate === 'function') {
      const date = maybeTimestamp.toDate();
      if (date instanceof Date) {
        return date.getTime();
      }
    }
  }
  return null;
}

function buildDocId(rule: RateLimitRule, identifierHash: string, suffix: string): string {
  return `${rule.scope}:${identifierHash}:${suffix}`;
}

function ensureFirestore() {
  initAdmin();
  return getDb();
}

async function enforceWithFirestore(rule: RateLimitRule, docId: string, identifierHash: string, window: WindowDescriptor, nowMs: number): Promise<RateLimitDecision> {
  const db = ensureFirestore();
  const docRef = db.collection(COLLECTION).doc(docId);
  let countAfter = 0;
  let expiresAtMs = window.expiresAtMs;

  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(docRef);
    if (!snapshot.exists) {
      countAfter = 1;
      expiresAtMs = window.expiresAtMs;
      tx.set(docRef, {
        name: rule.name,
        scope: rule.scope,
        identifierHash,
        bucket: window.bucketSuffix,
        windowMs: rule.windowMs,
        limit: rule.limit,
        count: 1,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromMillis(window.expiresAtMs),
      });
      return;
    }

    const data = snapshot.data() ?? {};
    const storedExpiresAt = readExpiresAtMs(data.expiresAt);
    if (!storedExpiresAt || storedExpiresAt <= nowMs) {
      countAfter = 1;
      expiresAtMs = window.expiresAtMs;
      tx.set(docRef, {
        name: rule.name,
        scope: rule.scope,
        identifierHash,
        bucket: window.bucketSuffix,
        windowMs: rule.windowMs,
        limit: rule.limit,
        count: 1,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromMillis(window.expiresAtMs),
      });
      return;
    }

    expiresAtMs = storedExpiresAt;
    const currentCount = typeof data.count === 'number' && Number.isFinite(data.count) ? data.count : 0;
    countAfter = currentCount + 1;
    tx.update(docRef, {
      count: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return buildDecision(rule, countAfter, expiresAtMs, nowMs);
}

function enforceInMemory(rule: RateLimitRule, memoryKey: string, window: WindowDescriptor, nowMs: number): RateLimitDecision {
  const entry = memoryStore.get(memoryKey);
  if (!entry || entry.expiresAtMs <= nowMs) {
    memoryStore.set(memoryKey, { count: 1, expiresAtMs: window.expiresAtMs });
    return buildDecision(rule, 1, window.expiresAtMs, nowMs);
  }

  entry.count += 1;
  return buildDecision(rule, entry.count, entry.expiresAtMs, nowMs);
}

function buildDecision(rule: RateLimitRule, count: number, expiresAtMs: number, nowMs: number): RateLimitDecision {
  const allowed = count <= rule.limit;
  const remaining = Math.max(rule.limit - count, 0);
  const retryAfterMs = allowed ? 0 : Math.max(expiresAtMs - nowMs, 0);
  const retryAfterSeconds = allowed ? 0 : Math.max(1, Math.ceil(retryAfterMs / 1000));
  return { allowed, remaining, limit: rule.limit, retryAfterMs, retryAfterSeconds };
}

export async function enforceRateLimit(rule: RateLimitRule, identifier: string, now: Date = new Date()): Promise<RateLimitDecision> {
  const normalized = normalizeIdentifier(rule, identifier);
  const identifierHash = hashIdentifier(rule.scope, normalized);
  const nowMs = now.getTime();
  const window = formatWindow(rule, nowMs);
  const docId = buildDocId(rule, identifierHash, window.bucketSuffix);

  if (isTestMode()) {
    const memoryKey = `${rule.name}:${identifierHash}:${window.bucketSuffix}`;
    return enforceInMemory(rule, memoryKey, window, nowMs);
  }

  return enforceWithFirestore(rule, docId, identifierHash, window, nowMs);
}

export const __testing = {
  clearMemory() {
    memoryStore.clear();
  },
  getMemoryKeys(): string[] {
    return Array.from(memoryStore.keys());
  },
};
