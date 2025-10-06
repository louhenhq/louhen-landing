import { test, expect } from '@playwright/test';

const SUPPORTED_HREFLANGS = ['en', 'de', 'en-de', 'de-de', 'de-at', 'x-default'] as const;

test.describe('Header SEO touchpoints', () => {
  test('privacy page canonical + hreflang per locale', async ({ page }) => {
    await page.goto('/legal/privacy', { waitUntil: 'networkidle' });

    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
    expect(canonical).toContain('/legal/privacy');
    for (const hreflang of SUPPORTED_HREFLANGS) {
      const href = await page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`).first().getAttribute('href');
      expect(href).toBeTruthy();
      expect(href as string).toContain('/legal/privacy');
    }

    await page.goto('/de/legal/privacy', { waitUntil: 'networkidle' });
    const canonicalDe = await page.locator('link[rel="canonical"]').first().getAttribute('href');
    expect(canonicalDe).toContain('/de/legal/privacy');
  });

  test('header CTA and ribbon links apply normalized UTMs', async ({ page }) => {
    await page.addInitScript({
      content: `window.__LOUHEN_PROMO_RIBBON__ = { id: 'playwright-test', href: '/promo' };`,
    });

    await page.goto('/en', { waitUntil: 'networkidle' });

    const cta = page.getByTestId('header-cta');
    const ctaHref = await cta.getAttribute('href');
    expect(ctaHref).toContain('utm_source=header');
    expect(ctaHref).toContain('utm_medium=cta');

    const ribbonCta = page.locator('[data-ribbon-cta]');
    await expect(ribbonCta).toBeVisible();
    const ribbonHref = await ribbonCta.getAttribute('href');
    expect(ribbonHref).toContain('utm_source=header');
    expect(ribbonHref).toContain('utm_medium=promo-ribbon');
  });
});
