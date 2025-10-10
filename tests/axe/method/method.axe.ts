import { expect, test } from '@tests/fixtures/playwright';
import { runAxe } from '@tests/fixtures/axe';
import { getDefaultLocale, localeUrl } from '@tests/e2e/_utils/url';

const locale = getDefaultLocale();

test.describe('Method page — accessibility', () => {
  test('landmarks, headings, and axe', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(localeUrl('/method', { locale }), { waitUntil: 'networkidle' });

    const banner = page.locator('[data-ll="nav-root"]');
    await expect(banner).toHaveAttribute('role', 'banner');

    const main = page.locator('main#main-content');
    await expect(main).toHaveAttribute('role', 'main');
    await expect(main).toHaveAttribute('aria-labelledby', 'method-hero-title');

    await expect(page.locator('h1#method-hero-title')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);

    await runAxe(page, testInfo, { route: 'method', locale, viewport: 'desktop' });
  });
});
