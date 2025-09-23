import { Buffer } from 'node:buffer';

import { expect, test } from '@playwright/test';

const STATUS_USER = process.env.STATUS_USER ?? '';
const STATUS_PASS = process.env.STATUS_PASS ?? '';
const HAS_CREDS = Boolean(STATUS_USER && STATUS_PASS);

test.describe('status diagnostics API', () => {
  test('returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/status');
    expect(response.status()).toBe(401);
    const wwwAuth = response.headers()['www-authenticate'];
    expect(wwwAuth).toBeTruthy();
    expect(wwwAuth).toMatch(/Basic/i);
  });

  test('returns JSON payload when authorized', async ({ request }) => {
    if (!HAS_CREDS) {
      test.skip('STATUS credentials missing');
    }

    const header = `Basic ${Buffer.from(`${STATUS_USER}:${STATUS_PASS}`).toString('base64')}`;
    const response = await request.get('/api/status', {
      headers: {
        Authorization: header,
        Accept: 'application/json',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.noncePresent).toBe('boolean');
    expect(['noop', 'resend']).toContain(body.emailTransport);
    expect(body).toHaveProperty('suppressionsCount');
    expect(body).toHaveProperty('env');
    expect(body.env).toHaveProperty('vercelEnv');
  });
});

test.describe('status diagnostics page', () => {
  test.skip(!HAS_CREDS, 'STATUS credentials missing');
  test.use({
    httpCredentials: {
      username: STATUS_USER,
      password: STATUS_PASS,
    },
  });

  test('renders key fields after auth', async ({ page }) => {
    await page.goto('/status');
    await expect(page.getByRole('heading', { name: /Operational diagnostics/i })).toBeVisible();
    await expect(page.getByText(/CSP nonce/i)).toBeVisible();
    await expect(page.getByText(/Transport mode/i)).toBeVisible();
    await expect(page.getByText(/Vercel env/i)).toBeVisible();
  });
});
