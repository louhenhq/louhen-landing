import { beforeAll, afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createWaitlistPostHandler,
  type WaitlistSignupDependencies,
} from '@/app/api/waitlist/route';
import {
  createWaitlistResendHandler,
  type WaitlistResendDependencies,
} from '@/app/api/waitlist/resend/route';
import { __testing } from '@/lib/rate/limiter';
import type { WaitlistUpsertInput, UpsertPendingResult, WaitlistDoc } from '@lib/server/waitlist/firestore.server';

vi.stubGlobal('console', console);

vi.mock('server-only', () => ({}));

const originalEnv = { ...process.env };

vi.mock('@/lib/env/guard', () => ({
  ensureWaitlistServerEnv: vi.fn(() => ({
    captcha: { hasSecret: true, configured: true },
  })),
}));

vi.mock('@/lib/email/sendWaitlistConfirm', () => ({
  sendWaitlistConfirmEmail: vi.fn(async () => ({ ok: true, transport: 'noop' as const })),
}));

vi.mock('@/lib/security/hcaptcha', () => ({
  verifyToken: vi.fn(async () => ({ success: true })),
}));

class InMemoryWaitlistRepository implements WaitlistSignupDependencies['repo'], WaitlistResendDependencies['repo'] {
  private store = new Map<string, WaitlistDoc>();

  reset() {
    this.store.clear();
  }

  async upsertPending(email: string, input: WaitlistUpsertInput): Promise<UpsertPendingResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.store.get(normalizedEmail);
    if (!existing) {
      const record: WaitlistDoc = {
        id: `doc-${this.store.size + 1}`,
        email: email.trim(),
        status: 'pending',
        locale: input.locale ?? null,
        confirmTokenHash: input.confirmTokenHash,
        confirmTokenLookupHash: input.confirmTokenLookupHash,
        confirmSalt: input.confirmSalt,
        confirmExpiresAt: input.confirmExpiresAt,
        consent: {
          gdpr: Boolean(input.consent),
          at: new Date(),
        },
        utm: input.utm ?? null,
        ref: input.ref ?? null,
      };
      this.store.set(normalizedEmail, record);
      return {
        created: true,
        status: 'pending',
        docId: record.id,
        locale: record.locale ?? null,
      };
    }

    const record = existing;
    record.status = 'pending';
    record.locale = input.locale ?? record.locale ?? null;
    record.utm = input.utm ?? record.utm ?? null;
    record.ref = input.ref ?? record.ref ?? null;
    record.confirmTokenHash = input.confirmTokenHash;
    record.confirmTokenLookupHash = input.confirmTokenLookupHash;
    record.confirmSalt = input.confirmSalt;
    record.confirmExpiresAt = input.confirmExpiresAt;
    this.store.set(normalizedEmail, record);

    return {
      created: false,
      status: record.status,
      docId: record.id,
      locale: record.locale ?? null,
    };
  }

  async findByEmail(email: string): Promise<WaitlistDoc | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const record = this.store.get(normalizedEmail);
    return record ? { ...record } : null;
  }
}

describe('API waitlist rate limiting', () => {
  let waitlistPost: ReturnType<typeof createWaitlistPostHandler>;
  let resendPost: ReturnType<typeof createWaitlistResendHandler>;
  let repo: InMemoryWaitlistRepository;

  beforeAll(async () => {
    process.env.TEST_MODE = '1';
    process.env.TEST_E2E_SHORTCIRCUIT = 'false';
    process.env.HCAPTCHA_SECRET = 'test-secret';
    process.env.RESEND_API_KEY = 'test-resend';
    process.env.RESEND_FROM = 'from@example.com';
    process.env.RESEND_REPLY_TO = 'reply@example.com';
    process.env.FIREBASE_ADMIN_SA_B64 = 'dGVzdA==';
    process.env.FIREBASE_PROJECT_ID = 'test';
    process.env.FIREBASE_DB_REGION = 'us-central1';
  });

  afterAll(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
    __testing.clearMemory();
  });

  beforeEach(() => {
    __testing.clearMemory();
    delete process.env.WAITLIST_RATE_SUBMITS_PER_HOUR_PER_IP;
    delete process.env.WAITLIST_RATE_RESENDS_PER_30M_PER_EMAIL;
    repo = new InMemoryWaitlistRepository();
    waitlistPost = createWaitlistPostHandler({
      repo,
    });
    resendPost = createWaitlistResendHandler({
      repo,
    });
  });

  test('POST /api/waitlist returns 429 after limit reached', async () => {
    process.env.WAITLIST_RATE_SUBMITS_PER_HOUR_PER_IP = '1';

    const makeRequest = () =>
      new Request('http://localhost/api/waitlist', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.0.113.5',
        },
        body: JSON.stringify({
          email: 'first@example.com',
          consent: true,
          locale: 'en',
          hcaptchaToken: 'dev-bypass',
        }),
      });

    const first = await waitlistPost(makeRequest());
    expect(first.status).toBe(200);

    const second = await waitlistPost(makeRequest());
    expect(second.status).toBe(429);
    expect(second.headers.get('Retry-After')).not.toBeNull();
    const payload = await second.json();
    expect(payload).toMatchObject({ ok: false, code: 'rate_limited' });
  });

  test('POST /api/waitlist/resend returns 429 after limit reached', async () => {
    process.env.WAITLIST_RATE_RESENDS_PER_30M_PER_EMAIL = '1';

    const makeRequest = () =>
      new Request('http://localhost/api/waitlist/resend', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'rate@test.example',
          hcaptchaToken: 'dev-bypass',
        }),
      });

    const first = await resendPost(makeRequest());
    expect(first.status).toBe(200);

    const second = await resendPost(makeRequest());
    expect(second.status).toBe(429);
    expect(second.headers.get('Retry-After')).not.toBeNull();
    const payload = await second.json();
    expect(payload).toMatchObject({ ok: false, code: 'rate_limited' });
  });
});
