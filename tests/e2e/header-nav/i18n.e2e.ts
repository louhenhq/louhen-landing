import { test, expect } from '@tests/fixtures/playwright';
import { localeUrl } from '../_utils/url';

const EXPECTED_HREFLANGS = ['en-de', 'de-de', 'fr-fr', 'nl-nl', 'it-it', 'x-default'] as const;

test.describe('Header locale switcher', () => {
  test('desktop switch preserves path, query, and metadata', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(localeUrl('/method?utm_source=playwright'), { waitUntil: 'domcontentloaded' });

    const select = page.locator('[data-ll="nav-locale-switcher"] select').first();
    await select.selectOption('de-de');

    await expect(page).toHaveURL(/\/de-de\/method\?utm_source=playwright/);

    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
    expect(canonical).toContain('/method');

    const hreflang = page.locator('link[rel="alternate"][hreflang="de-de"]').first();
    await expect(hreflang).toHaveAttribute('href', expect.stringContaining('/method'));

    for (const hreflangValue of EXPECTED_HREFLANGS) {
      const href = await page.locator(`link[rel="alternate"][hreflang="${hreflangValue}"]`).first().getAttribute('href');
      expect(href).toBeTruthy();
      expect(href as string).toContain('/method');
    }
  });

  test('mobile drawer switch closes after changing locale', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(localeUrl('?ref=mobile-test'), { waitUntil: 'domcontentloaded' });

    const trigger = page.locator('[data-ll="nav-menu-button"]');
    await trigger.click();

    const drawer = page.locator('[data-nav-drawer]');
    await expect(drawer).toBeVisible();

    const select = page.locator('[data-ll="nav-locale-switcher"] select').last();
    await select.selectOption('de-de');

    await expect(page).toHaveURL(/\/de-de\?ref=mobile-test/);
    await expect(drawer).toHaveCount(0);

    const skipLink = page.getByTestId('header-skip-link');
    await expect(skipLink).toHaveText('Zum Hauptinhalt springen');
  });
});
