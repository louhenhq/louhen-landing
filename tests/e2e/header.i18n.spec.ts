import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const EXPECTED_HREFLANGS = ['en', 'de', 'en-de', 'de-de', 'de-at', 'x-default'] as const;

test.describe('Header locale switcher', () => {
  test('desktop switch preserves path, query, and metadata', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en-de/method?utm_source=playwright', { waitUntil: 'networkidle' });

    const select = page.getByTestId('header-locale-select-desktop');
    await select.selectOption('de-de');

    await expect(page).toHaveURL(/\/de-de\/method\?utm_source=playwright/);

    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
    expect(canonical).toContain('/de-de/method');

    const hreflang = page.locator('link[rel="alternate"][hreflang="de-de"]').first();
    await expect(hreflang).toHaveAttribute('href', expect.stringContaining('/de-de/method'));

    for (const hreflangValue of EXPECTED_HREFLANGS) {
      const href = await page.locator(`link[rel="alternate"][hreflang="${hreflangValue}"]`).first().getAttribute('href');
      expect(href).toBeTruthy();
      expect(href as string).toContain('/method');
    }

    const axe = await new AxeBuilder({ page })
      .include('header')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const serious = axe.violations.filter((violation) => {
      const impact = violation.impact ?? 'minor';
      return impact === 'serious' || impact === 'critical';
    });

    expect(serious).toEqual([]);
  });

  test('mobile drawer switch closes after changing locale', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en?ref=mobile-test', { waitUntil: 'networkidle' });

    const trigger = page.locator('[data-nav-drawer-trigger]');
    await trigger.click();

    const drawer = page.locator('[data-nav-drawer]');
    await expect(drawer).toBeVisible();

    const select = page.getByTestId('header-locale-select-mobile');
    await select.selectOption('de');

    await expect(page).toHaveURL(/\/de\?ref=mobile-test/);
    await expect(drawer).toHaveCount(0);

    const skipLink = page.getByTestId('header-skip-link');
    await expect(skipLink).toHaveText('Zum Hauptinhalt springen');
  });
});
