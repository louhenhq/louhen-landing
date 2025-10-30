import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WaitlistUpsertInput } from '@lib/server/waitlist/firestore.server';

const store = new (class FakeStore {
  private collections = new Map<string, Map<string, Record<string, unknown>>>();

  clear() {
    this.collections.clear();
  }

  collection(name: string) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    const bucket = this.collections.get(name)!;
    return new FakeCollection(bucket);
  }
})();

class FakeCollection {
  constructor(private bucket: Map<string, Record<string, unknown>>) {}

  doc(id?: string) {
    const docId = id ?? randomUUID();
    return new FakeDocRef(this.bucket, docId);
  }

  where(field: string, _op: string, value: string) {
    return new FakeQuery(this.bucket, field, value);
  }
}

class FakeDocRef {
  constructor(private bucket: Map<string, Record<string, unknown>>, public readonly id: string) {}

  async set(data: Record<string, unknown>, options?: { merge?: boolean }) {
    const existing = this.bucket.get(this.id) || {};
    const next = options?.merge ? { ...existing, ...data } : { ...data };
    this.bucket.set(this.id, JSON.parse(JSON.stringify(next)));
  }

  get ref() {
    return this;
  }

  async get() {
    const data = this.bucket.get(this.id);
    return new FakeDocSnapshot(this.bucket, this.id, data ?? null);
  }
}

class FakeQuery {
  constructor(private bucket: Map<string, Record<string, unknown>>, private field: string, private value: string, private limitValue = 0) {}

  limit(n: number) {
    this.limitValue = n;
    return this;
  }

  async get() {
    const docs: FakeDocSnapshot[] = [];
    for (const [id, data] of this.bucket.entries()) {
      if ((data as Record<string, unknown>)[this.field] === this.value) {
        docs.push(new FakeDocSnapshot(this.bucket, id, data));
      }
      if (this.limitValue > 0 && docs.length >= this.limitValue) {
        break;
      }
    }
    return {
      empty: docs.length === 0,
      docs,
    };
  }
}

class FakeDocSnapshot {
  constructor(private bucket: Map<string, Record<string, unknown>>, public readonly id: string, private readonly snapshotData: Record<string, unknown> | null) {}

  data() {
    if (!this.snapshotData) return undefined;
    return JSON.parse(JSON.stringify(this.snapshotData));
  }

  get ref() {
    return new FakeDocRef(this.bucket, this.id);
  }
}

vi.mock('@/lib/firebaseAdmin', () => ({
  getDb: () => store,
}));

import { findByEmail, markConfirmedByTokenHash, markExpiredByTokenHash, upsertPending } from '@lib/server/waitlist/firestore.server';

function buildInput(overrides: Partial<WaitlistUpsertInput> = {}): WaitlistUpsertInput {
  return {
    locale: 'en',
    utm: { source: 'ads' },
    ref: 'invite',
    consent: true,
    confirmExpiresAt: new Date(Date.now() + 86400000),
    confirmTokenHash: 'hash-123',
    confirmTokenLookupHash: 'lookup-123',
    confirmSalt: 'salt-123',
    ...overrides,
  };
}

beforeEach(() => {
  store.clear();
});

describe('waitlist Firestore helpers', () => {
  it('creates a pending record for new emails', async () => {
    const result = await upsertPending('Test@Example.com', buildInput());
    expect(result.created).toBe(true);
    expect(result.status).toBe('pending');

    const record = await findByEmail('test@example.com');
    expect(record).not.toBeNull();
    expect(record?.status).toBe('pending');
    expect(record?.confirmTokenHash).toBe('hash-123');
  });

  it('updates existing pending record with new token', async () => {
    await upsertPending('user@example.com', buildInput());
    await upsertPending('user@example.com', buildInput({ confirmTokenHash: 'hash-456', confirmTokenLookupHash: 'lookup-456' }));

    const record = await findByEmail('user@example.com');
    expect(record?.confirmTokenHash).toBe('hash-456');
    expect(record?.confirmTokenLookupHash).toBe('lookup-456');
  });

  it('does not overwrite confirmed records', async () => {
    await upsertPending('confirmed@example.com', buildInput());
    const hash = 'lookup';
    await markConfirmedByTokenHash('lookup-123');

    await upsertPending('confirmed@example.com', buildInput({ confirmTokenHash: 'new-hash', confirmTokenLookupHash: hash }));
    const record = await findByEmail('confirmed@example.com');
    expect(record?.status).toBe('confirmed');
    expect(record?.confirmTokenHash).toBeNull();
  });

  it('marks record confirmed by lookup hash', async () => {
    await upsertPending('confirm@example.com', buildInput({ confirmTokenLookupHash: 'lookup-999' }));
    const result = await markConfirmedByTokenHash('lookup-999');
    expect(result).toBe('confirmed');

    const record = await findByEmail('confirm@example.com');
    expect(record?.status).toBe('confirmed');
    expect(record?.confirmedAt).toBeInstanceOf(Date);
  });

  it('marks record expired by lookup hash', async () => {
    await upsertPending('expire@example.com', buildInput({ confirmTokenLookupHash: 'lookup-321' }));
    const result = await markExpiredByTokenHash('lookup-321');
    expect(result).toBe('expired');

    const record = await findByEmail('expire@example.com');
    expect(record?.status).toBe('expired');
    expect(record?.confirmTokenLookupHash).toBeNull();
  });
});
