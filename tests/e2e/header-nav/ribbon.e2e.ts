import { test, expect } from '@tests/fixtures/playwright';
import { localeUrl } from '../_utils/url';

test.describe('Header promo ribbon', () => {
  test('renders, tracks dismissal, and stays hidden after reload', async ({ page }) => {
    await page.addInitScript(() => {
      window.__LOUHEN_PROMO_RIBBON__ = {
        id: 'default',
        href: '/promo',
      };
    });

    await page.goto(localeUrl(), { waitUntil: 'networkidle' });

    const ribbon = page.locator('[data-ribbon]');
    await expect(ribbon).toBeVisible();
    await expect(ribbon.locator('a[data-ribbon-cta]')).toHaveAttribute('href', /utm_medium=promo-ribbon/);

    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(ribbon).toHaveCount(0);

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('[data-ribbon]')).toHaveCount(0);
    await expect(page.locator('[data-ribbon-placeholder]')).toBeVisible();
  });
});
