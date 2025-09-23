import { test, expect } from '@playwright/test';

const LOCALE = 'en';
const SHORT_CIRCUIT_ENABLED = process.env.TEST_E2E_SHORTCIRCUIT === 'true';
const BYPASS_TOKEN = process.env.TEST_E2E_BYPASS_TOKEN || 'e2e-mocked-token';

function validWaitlistPayload() {
  return {
    email: `e2e+${Date.now()}@example.com`,
    locale: LOCALE,
    captchaToken: BYPASS_TOKEN,
    gdprConsent: true,
  };
}

test.describe('API /api/waitlist', () => {
  test('400 on invalid payload (missing email)', async ({ request }) => {
    const response = await request.post('/api/waitlist', {
      data: {
        locale: LOCALE,
        captchaToken: 'invalid-token',
        gdprConsent: true,
      },
      headers: { 'content-type': 'application/json' },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const body = await response.json();
    expect(body).toMatchObject({ ok: false, code: 'invalid_payload' });
    expect(JSON.stringify(body)).toMatch(/email/i);
  });

  test('rejects non-JSON bodies', async ({ request }) => {
    const response = await request.post('/api/waitlist', {
      data: 'email=foo',
      headers: { 'content-type': 'text/plain' },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    const body = await response.text();
    expect(body).toMatch(/parse|json/i);
  });

  test('rejects invalid email and surfaces field name', async ({ request }) => {
    const response = await request.post('/api/waitlist', {
      data: {
        email: 'not-an-email',
        locale: LOCALE,
        captchaToken: BYPASS_TOKEN,
        gdprConsent: true,
      },
      headers: { 'content-type': 'application/json' },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    const body = await response.text();
    expect(body).toMatch(/email/i);
  });

  test('200/201 on valid payload when short-circuit enabled', async ({ request }) => {
    test.skip(!SHORT_CIRCUIT_ENABLED, 'Requires TEST_E2E_SHORTCIRCUIT to bypass external services.');

    const response = await request.post('/api/waitlist', {
      data: validWaitlistPayload(),
      headers: { 'content-type': 'application/json' },
    });

    expect([200, 201]).toContain(response.status());

    const json = await response.json().catch(() => ({}));
    expect(json).toMatchObject({ ok: true });
  });
});
