import { expect, test } from '@playwright/test';
import { DEFAULT_LOCALE } from '@/lib/i18n/locales';

const LOCALE = DEFAULT_LOCALE.value;

test.describe('Method localized route', () => {
  test('renders hero, pillars, and CTA', async ({ page }) => {
    await page.goto(`/${LOCALE}/method`);

    await expect(page.getByTestId('method-hero')).toBeVisible();
    await expect(page.getByTestId('method-pillars')).toBeVisible();

    const cta = page.getByTestId('method-cta').getByRole('link');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', new RegExp(`/${LOCALE}/waitlist`));

    const navMethodLink = page.getByRole('link', { name: /^Method$/ }).first();
    await expect(navMethodLink).toHaveAttribute('href', new RegExp(`/${LOCALE}/method`));

    const canonicalHref = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonicalHref).toBeTruthy();
    if (canonicalHref) {
      const canonicalUrl = new URL(canonicalHref);
      expect(canonicalUrl.pathname.replace(/\/$/, '')).toBe(`/${LOCALE}/method`);
    }

    const alternates = await page
      .locator('link[rel="alternate"]')
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          hreflang: node.getAttribute('hreflang'),
          href: node.getAttribute('href'),
        }))
      );

    const [language, region] = LOCALE.split('-');
    const expectedHrefLang = region ? `${language}-${region.toUpperCase()}` : language;

    expect(
      alternates.some(
        (entry) => entry.hreflang === expectedHrefLang && entry.href?.includes(`/${LOCALE}/method`)
      )
    ).toBeTruthy();
    expect(alternates.some((entry) => entry.hreflang === 'x-default' && entry.href?.includes('/method'))).toBeTruthy();
  });
});

test.describe('Method bare route', () => {
  test('returns not found', async ({ page }) => {
    const response = await page.goto('/method');
    expect(response?.status()).toBe(404);

    await expect(page).toHaveTitle(/not found|404/i);
  });
});
