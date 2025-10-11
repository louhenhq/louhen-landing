import { test, expect } from '@tests/fixtures/playwright';
import { localeUrl } from '../_utils/url';

const SUPPORTED_HREFLANGS = ['en-de', 'de-de', 'fr-fr', 'nl-nl', 'it-it', 'x-default'] as const;

test.describe('Header SEO touchpoints', () => {
  test('privacy page canonical + hreflang per locale', async ({ page }) => {
    await page.goto(localeUrl('/legal/privacy'), { waitUntil: 'domcontentloaded' });

    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
    expect(canonical).toContain('/legal/privacy');
    for (const hreflang of SUPPORTED_HREFLANGS) {
      const href = await page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`).first().getAttribute('href');
      expect(href).toBeTruthy();
      expect(href as string).toContain('/legal/privacy');
    }

    await page.goto(localeUrl('/legal/privacy', { locale: 'de-de' }), { waitUntil: 'domcontentloaded' });
    const canonicalDe = await page.locator('link[rel="canonical"]').first().getAttribute('href');
    expect(canonicalDe).toContain('/legal/privacy');
  });

  test('header CTA and ribbon links apply normalized UTMs', async ({ page }) => {
    await page.addInitScript({
      content: `window.__LOUHEN_PROMO_RIBBON__ = { id: 'playwright-test', href: '/promo' };`,
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
    await expect(page).toHaveURL(/\/de-de\/?$/);

    const cta = page.getByTestId('lh-nav-cta-primary');
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
