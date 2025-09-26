import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

import { buildUnsubUrl } from '@/lib/email/tokens';

const TEST_SCOPE = 'transactional' as const;

function uniqueEmail() {
  return `playwright-unsubscribe-${randomUUID()}@example.com`;
}

async function expectSuppressed(request: import('@playwright/test').APIRequestContext, email: string) {
  await expect.poll(async () => {
    const response = await request.get(`/api/unsubscribe?email=${encodeURIComponent(email)}&scope=${TEST_SCOPE}`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    return data.allowed;
  }).toBe(false);
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

    await page.goto('/unsubscribe?status=manual-success');
    await expect(page.getByText(/Thanks! Your unsubscribe request/i)).toBeVisible();
  });
});
