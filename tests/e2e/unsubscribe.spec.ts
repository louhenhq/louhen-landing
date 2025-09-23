import { expect, test } from '@playwright/test';

import { shouldSend } from '@/lib/email/suppress';
import { buildUnsubUrl } from '@/lib/email/tokens';

const TEST_SCOPE = 'transactional' as const;

if (!process.env.SUPPRESSION_SALT) {
  process.env.SUPPRESSION_SALT = 'test-salt';
}

if (!process.env.APP_BASE_URL) {
  process.env.APP_BASE_URL = 'http://localhost:4311';
}

function uniqueEmail() {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  return `playwright-unsubscribe-${id}@example.com`;
}

async function expectSuppressed(email: string) {
  const suppression = await shouldSend({ email, scope: TEST_SCOPE });
  expect(suppression.allowed).toBe(false);
}

test.describe('Unsubscribe flow', () => {
  test('token link suppresses future sends', async ({ page }) => {
    const email = uniqueEmail();
    const url = buildUnsubUrl(email, 'all');

    await page.goto(url);
    await expect(page.getByText(/Success!/i)).toBeVisible();

    await expectSuppressed(email);
  });

  test('manual unsubscribe via API suppresses email', async ({ page, request }) => {
    const email = uniqueEmail();

    await request.post('/api/unsubscribe', {
      form: {
        email,
      },
    });

    await expectSuppressed(email);

    await page.goto('/unsubscribe?status=manual-success');
    await expect(page.getByText(/Thanks! Your unsubscribe request/i)).toBeVisible();
  });
});
