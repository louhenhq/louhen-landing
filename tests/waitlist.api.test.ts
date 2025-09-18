import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('@/lib/email/send', () => ({
  sendWaitlistConfirmEmail: vi.fn(async () => ({})),
}));

const firestoreModule = vi.hoisted(() => {
  let instance: any;
  return {
    set(instanceRef: any) {
      instance = instanceRef;
    },
    get() {
      return instance;
    },
  };
});

vi.mock('@/lib/firebaseAdmin', () => ({
  initAdmin: () => ({ firestore: () => firestoreModule.get() }),
}));

vi.mock('@/lib/crypto/token', () => ({
  randomTokenBase64Url: () => 'mock-token',
  sha256Hex: () => 'mock-hash',
}));

vi.mock('@/lib/crypto/emailHash', () => ({
  emailHash: (email: string) => `hash_${email}`,
}));

const deleteSentinel = Symbol('delete');

vi.mock('firebase-admin/firestore', async () => {
  class MockFieldValue {
    static serverTimestamp() {
      return { __type: 'timestamp', value: new Date() };
    }
    static increment(value: number) {
      return { __type: 'increment', value };
    }
    static delete() {
      return { __type: 'delete', value: deleteSentinel };
    }
  }

  class Timestamp {
    private readonly date: Date;
    constructor(date: Date) {
      this.date = date;
    }
    static fromDate(date: Date) {
      return new Timestamp(date);
    }
    toDate() {
      return this.date;
    }
  }

  return { FieldValue: MockFieldValue, Timestamp };
});

type CollectionData = Map<string, Record<string, any>>;

function createFirestoreFixture() {
  const waitlist: CollectionData = new Map();
  const referrals: CollectionData = new Map();
  const events: any[] = [];

  const collections: Record<string, CollectionData | any[]> = {
    waitlist,
    waitlist_referrals: referrals,
    events,
  };

  const applySentinel = (target: Record<string, any>, key: string, value: any) => {
    if (value && typeof value === 'object' && value.__type) {
      switch (value.__type) {
        case 'timestamp':
          target[key] = new Date(value.value);
          break;
        case 'increment':
          target[key] = (target[key] || 0) + value.value;
          break;
        case 'delete':
          delete target[key];
          break;
        default:
          target[key] = value;
      }
    } else {
      target[key] = value;
    }
  };

  const db = {
    collection(name: string) {
      const store = collections[name];
      if (!store) throw new Error(`Unknown collection: ${name}`);

      if (Array.isArray(store)) {
        return {
          add: async (data: Record<string, any>) => {
            store.push(data);
          },
        };
      }

      return {
        doc(id: string) {
          return {
            async get() {
              const data = store.get(id);
              return {
                exists: Boolean(data),
                data: () => data,
                get: (field: string) => data?.[field],
              };
            },
            async set(data: Record<string, any>, options?: { merge?: boolean }) {
              const existing = store.get(id) || {};
              if (options?.merge) {
                const merged = { ...existing };
                Object.entries(data).forEach(([key, value]) => applySentinel(merged, key, value));
                store.set(id, merged);
              } else {
                const replaced: Record<string, any> = {};
                Object.entries(data).forEach(([key, value]) => applySentinel(replaced, key, value));
                store.set(id, replaced);
              }
            },
          };
        },
      };
    },
  };

  return {
    firestore: db,
    data: { waitlist, referrals, events },
  };
}

async function invokeWaitlist(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  const request = new Request('https://example.com/api/waitlist', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': payload.ip || '1.1.1.1' },
    body,
  });
  const module = await import('@/app/api/waitlist/route');
  return module.POST(request);
}

describe('/api/waitlist referral protections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts a valid referral and marks as accepted', async () => {
    const fixture = createFirestoreFixture();
    const inviterId = 'hash_owner@louhen.com';
    fixture.data.waitlist.set(inviterId, {
      email: 'owner@louhen.com',
      emailLc: 'owner@louhen.com',
      refCode: 'INVITER',
    });
    fixture.data.referrals.set('INVITER', { userId: inviterId });
    firestoreModule.set(fixture.firestore);

    const response = await invokeWaitlist({ email: 'new@guest.org', referredBy: 'INVITER' });
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.refAccepted).toBe(true);
    expect(fixture.data.events.some((event) => event.name === 'wl_referral_blocked')).toBe(false);
  });

  it('flags self-referral and delays credit', async () => {
    const fixture = createFirestoreFixture();
    const ownerId = 'hash_owner@louhen.com';
    fixture.data.waitlist.set(ownerId, { emailLc: 'owner@example.com', refCode: 'OWNER123' });
    fixture.data.referrals.set('OWNER123', { userId: ownerId });
    firestoreModule.set(fixture.firestore);

    const response = await invokeWaitlist({ email: 'owner@louhen.com', referredBy: 'OWNER123' });
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.creditDelayed).toBe(true);
    expect(fixture.data.events.some((event) => event.name === 'wl_referral_blocked' && event.reason === 'self')).toBe(true);
  });

  it('enforces ip cap for referrals', async () => {
    const fixture = createFirestoreFixture();
    const inviterId = 'hash_friend@example.com';
    fixture.data.waitlist.set(inviterId, { emailLc: 'friend@example.com', refCode: 'FRREF' });
    fixture.data.referrals.set('FRREF', { userId: inviterId });
    ((globalThis as any).__waitlistBuckets as Map<string, any>)?.clear?.();
    ((globalThis as any).__waitlistReferralBuckets as Map<string, any>)?.clear?.();
    firestoreModule.set(fixture.firestore);

    let lastResponse: Response | null = null;
    for (let i = 0; i < 12; i++) {
      lastResponse = await invokeWaitlist({ email: `user${i}@example.com`, referredBy: 'FRREF', ip: '2.2.2.2' });
      const bucket = ((globalThis as any).__waitlistBuckets as Map<string, any>)?.get?.('2.2.2.2');
      if (bucket) bucket.count = 0;
      if (lastResponse.status === 429) break;
    }
    if (!lastResponse) throw new Error('No response captured');
    expect(lastResponse.status).toBe(429);
    const json = await lastResponse.json();
    expect(json.error).toBe('referral_rate_limit');
    expect(fixture.data.events.some((event) => event.name === 'wl_referral_blocked' && event.reason === 'ip_cap')).toBe(true);
  });
});
