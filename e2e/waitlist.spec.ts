import { test, expect } from '@playwright/test';

test.describe('waitlist flows', () => {
  test.skip(process.env.PLAYWRIGHT_ENABLE !== '1', 'Set PLAYWRIGHT_ENABLE=1 to run E2E waitlist tests');

  test('landing loads in English', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('heading', { name: /personal style/i })).toBeVisible();
  });
});
