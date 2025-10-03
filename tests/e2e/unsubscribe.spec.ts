import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

import { buildUnsubUrl } from '@/lib/email/tokens';

const TEST_SCOPE = 'transactional' as const;

function uniqueEmail() {
  return `playwright-unsubscribe-${randomUUID()}@example.com`;
}

async function expectSuppressed(request: import('@playwright/test').APIRequestContext, email: string) {
  await expect
    .poll(async () => {
      const response = await request.get('/api/unsubscribe', {
        params: { email, scope: TEST_SCOPE },
      });
      if (!response.ok()) {
        return null;
      }
      const data = await response.json().catch(() => null);
      return data?.allowed ?? null;
    }, { timeout: 5_000, message: `Expected suppression flag for ${email}` })
    .toBe(false);
}

test.describe('Unsubscribe flow', () => {
  test('token link suppresses future sends', async ({ page, request }) => {
    const email = uniqueEmail();
    const url = buildUnsubUrl(email, 'all');

    await page.goto(url);
    await expect(page.getByText(/stop emailing/i)).toBeVisible();

    await expectSuppressed(request, email);
  });

  test('manual unsubscribe via API suppresses email', async ({ page, request }) => {
    const email = uniqueEmail();

    await request.post('/api/unsubscribe', {
      form: {
        email,
      },
    });

    await expectSuppressed(request, email);

    await page.goto('/en-de/unsubscribe?status=manual-success');
    await expect(page.getByText(/Thanks! Your unsubscribe request/i)).toBeVisible();
  });
});
