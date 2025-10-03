import { beforeAll, afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { __testing } from '@/lib/rate/limiter';

vi.stubGlobal('console', console);

vi.mock('server-only', () => ({}));

const originalEnv = { ...process.env };

vi.mock('@/lib/env/guard', () => ({
  ensureWaitlistServerEnv: vi.fn(() => ({
    captcha: { hasSecret: true, configured: true },
  })),
}));

vi.mock('@/lib/firestore/waitlist', () => ({
  findByEmail: vi.fn(async () => ({
    id: 'doc-id',
    email: 'test@example.com',
    status: 'pending',
  })),
  upsertPending: vi.fn(async () => ({
    created: false,
    status: 'pending',
    docId: 'doc-id',
    locale: 'en',
  })),
}));

vi.mock('@/lib/email/sendWaitlistConfirm', () => ({
  sendWaitlistConfirmEmail: vi.fn(async () => ({ ok: true, transport: 'noop' as const })),
}));

vi.mock('@/lib/security/hcaptcha', () => ({
  verifyToken: vi.fn(async () => ({ success: true })),
}));

describe('API waitlist rate limiting', () => {
  let waitlistRoute: typeof import('@/app/api/waitlist/route');
  let resendRoute: typeof import('@/app/api/waitlist/resend/route');

  beforeAll(async () => {
    process.env.TEST_MODE = '1';
    process.env.TEST_E2E_SHORTCIRCUIT = 'true';
    process.env.HCAPTCHA_SECRET = 'test-secret';
    process.env.RESEND_API_KEY = 'test-resend';
    process.env.RESEND_FROM = 'from@example.com';
    process.env.RESEND_REPLY_TO = 'reply@example.com';
    process.env.FIREBASE_ADMIN_SA_B64 = 'dGVzdA==';
    process.env.FIREBASE_PROJECT_ID = 'test';
    process.env.FIREBASE_DB_REGION = 'us-central1';

    waitlistRoute = await import('@/app/api/waitlist/route');
    resendRoute = await import('@/app/api/waitlist/resend/route');
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
  });

  test('POST /api/waitlist returns 429 after limit reached', async () => {
    process.env.WAITLIST_RATE_SUBMITS_PER_HOUR_PER_IP = '1';

    const { POST } = waitlistRoute;

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

    const first = await POST(makeRequest());
    expect(first.status).toBe(200);

    const second = await POST(makeRequest());
    expect(second.status).toBe(429);
    expect(second.headers.get('Retry-After')).not.toBeNull();
    const payload = await second.json();
    expect(payload).toMatchObject({ ok: false, code: 'rate_limited' });
  });

  test('POST /api/waitlist/resend returns 429 after limit reached', async () => {
    process.env.WAITLIST_RATE_RESENDS_PER_30M_PER_EMAIL = '1';

    const { POST } = resendRoute;

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

    const first = await POST(makeRequest());
    expect(first.status).toBe(200);

    const second = await POST(makeRequest());
    expect(second.status).toBe(429);
    expect(second.headers.get('Retry-After')).not.toBeNull();
    const payload = await second.json();
    expect(payload).toMatchObject({ ok: false, code: 'rate_limited' });
  });
});
