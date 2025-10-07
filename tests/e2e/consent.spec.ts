import { expect, test } from '@playwright/test';
import { localeUrl } from './_utils/url';

function getBanner(page: import('@playwright/test').Page) {
  return page.getByRole('dialog', { name: /cookies/i });
}

test.describe('Consent banner', () => {
  test('accepting consent hides banner and persists choice', async ({ context, page }) => {
    await context.clearCookies();
    await page.goto(localeUrl());

    const dialog = getBanner(page);
    await expect(dialog).toBeVisible();

    const acceptButton = page.getByRole('button', { name: /Accept all/i });
    await acceptButton.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => window.__LOUHEN_CONSENT__?.analytics === true)).toBeTruthy();
    await expect(dialog).toHaveCount(0);

    await page.reload();
    await expect(getBanner(page)).toHaveCount(0);

    const analyticsReady = await page.evaluate(() => window.__LOUHEN_ANALYTICS_READY === true);
    expect(analyticsReady).toBe(true);

    await context.clearCookies();
    await page.reload();
    await expect(getBanner(page)).toBeVisible();
  });
});
