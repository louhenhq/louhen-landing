import { test, expect } from '@tests/fixtures/playwright';
import { getDefaultLocale, localeUrl } from '../_utils/url';

const EXPECTED_HREFLANGS = ['en-de', 'de-de', 'fr-fr', 'nl-nl', 'it-it', 'x-default'] as const;
const defaultLocale = getDefaultLocale();

test.describe('Header locale switcher', () => {
  test('desktop switch preserves path, query, and metadata', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(localeUrl('/method?utm_source=playwright'), { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');

    const select = page.getByTestId('lh-nav-lang-switcher-desktop-select');
    await select.selectOption('de-de');

    await expect(page).toHaveURL(/\/de-de\/method\?utm_source=playwright/);

    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
    expect(canonical).toContain('/de-de/method');

    const hreflang = page.locator('link[rel="alternate"][hreflang="de-de"]').first();
    await expect(hreflang).toHaveAttribute('href', expect.stringContaining('/de-de/method'));

    for (const hreflangValue of EXPECTED_HREFLANGS) {
      const link = page.locator(`link[rel="alternate"][hreflang="${hreflangValue}"]`).first();
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
      const expectedLocale = hreflangValue === 'x-default' ? defaultLocale : hreflangValue;
      expect(href as string).toContain(`/${expectedLocale}/method`);
    }
  });

  test('mobile drawer switch closes after changing locale', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(localeUrl('?ref=mobile-test'), { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');

    const trigger = page.getByTestId('lh-nav-menu-toggle');
    await trigger.click();

    const drawer = page.locator('[data-nav-drawer]');
    await expect(drawer).toBeVisible();

    const select = page.getByTestId('lh-nav-lang-switcher-mobile-select');
    await select.selectOption('de-de');

    await expect(page).toHaveURL(/\/de-de\?ref=mobile-test/);
    await expect(drawer).toHaveCount(0);

    const skipLink = page.getByTestId('lh-nav-skip-link');
    await expect(skipLink).toHaveText('Zum Hauptinhalt springen');
  });
});
