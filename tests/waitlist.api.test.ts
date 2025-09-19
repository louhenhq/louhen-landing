import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreModule = vi.hoisted(() => {
  let instance: ReturnType<typeof createFirestoreFixture> | null = null;
  return {
    set(fixture: ReturnType<typeof createFirestoreFixture>) {
      instance = fixture;
    },
    get() {
      if (!instance) throw new Error('Firestore fixture not initialised');
      return instance.firestore;
    },
    data() {
      if (!instance) throw new Error('Firestore fixture not initialised');
      return instance.data;
    },
  };
});

vi.mock('@/lib/firebaseAdmin', () => ({
  initAdmin: () => ({ firestore: () => firestoreModule.get() }),
}));

vi.mock('@/lib/waitlist/email', () => ({
  sendWaitlistConfirmEmail: vi.fn(async () => {}),
  sendWaitlistWelcomeEmail: vi.fn(async () => {}),
}));

vi.mock('@/lib/analytics', () => ({
  logAnalyticsEvent: vi.fn(async () => {}),
}));

vi.mock('@/lib/crypto/emailHash', () => ({
  emailHash: (email: string) => `hash_${email}`,
}));

vi.mock('firebase-admin/firestore', async () => {
  class MockFieldValue {
    static serverTimestamp() {
      return { __type: 'timestamp', value: new Date() };
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
    toMillis() {
      return this.date.getTime();
    }
    toDate() {
      return this.date;
    }
  }

  return {
    FieldValue: MockFieldValue,
    Timestamp,
  };
});

type CollectionData = Map<string, Record<string, any>>;

function createFirestoreFixture() {
  const waitlist: CollectionData = new Map();

  function applySentinel(target: Record<string, any>, key: string, value: any) {
    if (value && typeof value === 'object' && value.__type === 'timestamp') {
      target[key] = value.value instanceof Date ? value.value : new Date(value.value);
      return;
    }
    target[key] = value;
  }

  const firestore = {
    collection(name: string) {
      if (name === 'waitlist') {
        return {
          doc(id: string) {
            return {
              async get() {
                const data = waitlist.get(id);
                return {
                  exists: Boolean(data),
                  data: () => data,
                  get(field: string) {
                    return data?.[field];
                  },
                  ref: this,
                };
              },
              async set(data: Record<string, any>, options?: { merge?: boolean }) {
                const existing = waitlist.get(id) || {};
                if (options?.merge) {
                  const merged = { ...existing };
                  for (const [key, value] of Object.entries(data)) {
                    applySentinel(merged, key, value);
                  }
                  waitlist.set(id, merged);
                } else {
                  const fresh: Record<string, any> = {};
                  for (const [key, value] of Object.entries(data)) {
                    applySentinel(fresh, key, value);
                  }
                  waitlist.set(id, fresh);
                }
              },
            };
          },
          where(field: string, op: string, value: unknown) {
            if (field !== 'confirmToken' || op !== '==') {
              throw new Error('Unsupported query in test fixture');
            }
            return {
              limit() {
                return this;
              },
              async get() {
                const matches = Array.from(waitlist.entries())
                  .filter(([, data]) => data[field] === value)
                  .map(([id, data]) => ({
                    id,
                    data: () => data,
                    ref: {
                      set: async (update: Record<string, any>, options?: { merge?: boolean }) => {
                        const doc = waitlist.get(id) || {};
                        if (options?.merge) {
                          const merged = { ...doc };
                          for (const [key, val] of Object.entries(update)) {
                            applySentinel(merged, key, val);
                          }
                          waitlist.set(id, merged);
                        } else {
                          const replacement: Record<string, any> = {};
                          for (const [key, val] of Object.entries(update)) {
                            applySentinel(replacement, key, val);
                          }
                          waitlist.set(id, replacement);
                        }
                      },
                    },
                  }));
                return { empty: matches.length === 0, docs: matches };
              },
            };
          },
        };
      }

      throw new Error(`Unexpected collection: ${name}`);
    },
  };

  return {
    firestore,
    data: { waitlist },
  };
}

describe('/api/waitlist', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    const fixture = createFirestoreFixture();
    firestoreModule.set(fixture);
    process.env.HCAPTCHA_SECRET = 'test-secret';
    process.env.APP_BASE_URL = 'https://louhen.example';
    ((globalThis as any).__waitlistBuckets as Map<string, any>)?.clear?.();
    globalThis.fetch = vi.fn(async () => ({
      json: async () => ({ success: true }),
    })) as unknown as typeof fetch;
  });

  it('stores a pending waitlist entry and sends confirmation email', async () => {
    const { POST } = await import('@/app/api/waitlist/route');
    const request = new Request('https://test.local/api/waitlist', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        locale: 'en',
        captchaToken: 'captcha-token',
        gdprConsent: true,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);

    const fixtureData = firestoreModule.data();
    const record = fixtureData.waitlist.get('hash_test@example.com');
    expect(record).toBeDefined();
    expect(record.status).toBe('pending');
    expect(typeof record.confirmToken).toBe('string');
    expect(record.gdprConsent).toBe(true);

    const emailModule = await import('@/lib/waitlist/email');
    expect(emailModule.sendWaitlistConfirmEmail).toHaveBeenCalledTimes(1);

    const analyticsModule = await import('@/lib/analytics');
    expect(analyticsModule.logAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'waitlist_signup_submitted' })
    );
    expect(analyticsModule.logAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'waitlist_signup_accepted' })
    );
  });

  it('rejects invalid captcha with 429', async () => {
    globalThis.fetch = vi.fn(async () => ({
      json: async () => ({ success: false }),
    })) as unknown as typeof fetch;
    const { POST } = await import('@/app/api/waitlist/route');
    const request = new Request('https://test.local/api/waitlist', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.11',
      },
      body: JSON.stringify({
        email: 'blocked@example.com',
        locale: 'en',
        captchaToken: 'bad-token',
        gdprConsent: true,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body).toMatchObject({ ok: false, code: 'captcha_failed' });

    const emailModule = await import('@/lib/waitlist/email');
    expect(emailModule.sendWaitlistConfirmEmail).not.toHaveBeenCalled();
  });

  it('returns informative message when email already confirmed', async () => {
    const fixtureData = firestoreModule.data();
    fixtureData.waitlist.set('hash_test@example.com', {
      email: 'test@example.com',
      locale: 'en',
      status: 'confirmed',
    });

    const { POST } = await import('@/app/api/waitlist/route');
    const request = new Request('https://test.local/api/waitlist', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.12',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        locale: 'en',
        captchaToken: 'token',
        gdprConsent: true,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, message: 'This email has already been confirmed.' });
  });
});

describe('/api/waitlist/confirm', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    const fixture = createFirestoreFixture();
    firestoreModule.set(fixture);
    process.env.APP_BASE_URL = 'https://louhen.example';
  });

  it('confirms a valid token and sends welcome email', async () => {
    const { Timestamp } = await import('firebase-admin/firestore');
    const fixture = firestoreModule.data();
    const token = 'valid-confirm-token-123456';
    const tokenHash = createHash('sha256').update(token).digest('hex');
    fixture.waitlist.set('hash_user@example.com', {
      email: 'user@example.com',
      locale: 'en',
      status: 'pending',
      confirmToken: tokenHash,
      confirmExpiresAt: Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)),
    });

    const { GET } = await import('@/app/api/waitlist/confirm/route');
    const request = new NextRequest(`https://test.local/api/waitlist/confirm?token=${token}`);
    const response = await GET(request);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://test.local/waitlist/success?status=confirmed');

    const updated = fixture.waitlist.get('hash_user@example.com');
    expect(updated.status).toBe('confirmed');
    expect(updated.confirmToken).toBeNull();

    const emailModule = await import('@/lib/waitlist/email');
    expect(emailModule.sendWaitlistWelcomeEmail).toHaveBeenCalledWith({ to: 'user@example.com' });

    const analyticsModule = await import('@/lib/analytics');
    expect(analyticsModule.logAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'waitlist_confirmed' })
    );
  });

  it('returns 410 for expired tokens and logs event', async () => {
    const { Timestamp } = await import('firebase-admin/firestore');
    const fixture = firestoreModule.data();
    const token = 'expired-token-123456';
    const tokenHash = createHash('sha256').update(token).digest('hex');
    fixture.waitlist.set('hash_user@example.com', {
      email: 'user@example.com',
      locale: 'en',
      status: 'pending',
      confirmToken: tokenHash,
      confirmExpiresAt: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)),
    });

    const { GET } = await import('@/app/api/waitlist/confirm/route');
    const request = new NextRequest(`https://test.local/api/waitlist/confirm?token=${token}`);
    const response = await GET(request);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://test.local/waitlist/expired');

    const analyticsModule = await import('@/lib/analytics');
    expect(analyticsModule.logAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'waitlist_expired' })
    );
  });
});
