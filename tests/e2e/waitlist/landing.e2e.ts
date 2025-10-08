import { expect, test } from '@playwright/test';
import { getTestLocales, localeUrl } from '@tests/e2e/_utils/url';

const locales = getTestLocales();
const WAITLIST_API = '**/api/waitlist';

test.describe('Waitlist form (waitlist page)', () => {
  for (const locale of locales) {
    test(`${locale} submits with consent`, async ({ page }) => {
      await page.route(WAITLIST_API, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      });

      try {
        await page.goto(localeUrl('/waitlist', { locale }), { waitUntil: 'networkidle' });

        const form = page.locator('[data-ll="wl-form"]').first();
        await expect(form).toBeVisible();

        const emailInput = page.locator('[data-ll="wl-email-input"]').first();
        const consentCheckbox = page.locator('[data-ll="wl-consent-checkbox"]').first();
        const submitButton = page.locator('[data-ll="wl-submit"]').first();

        await expect(submitButton).toBeDisabled();

        await emailInput.fill(`playwright-${Date.now()}@example.com`);
        await expect(submitButton).toBeDisabled();

        await consentCheckbox.check({ force: true });
        await expect(submitButton).toBeEnabled();

        const intent = page.waitForResponse(WAITLIST_API);
        await submitButton.click();
        await intent;

        await expect(page.locator('[data-ll="wl-success"]').first()).toBeVisible();
        await expect(page.locator('[data-ll="wl-error"]')).toHaveCount(0);
      } finally {
        await page.unroute(WAITLIST_API);
      }
    });

    test(`${locale} surfaces server errors`, async ({ page }) => {
      await page.route(WAITLIST_API, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ ok: false, message: 'server_error' }),
        });
      });

      try {
        await page.goto(localeUrl('/waitlist', { locale }), { waitUntil: 'networkidle' });

        const emailInput = page.locator('[data-ll="wl-email-input"]').first();
        const consentCheckbox = page.locator('[data-ll="wl-consent-checkbox"]').first();
        const submitButton = page.locator('[data-ll="wl-submit"]').first();

        await emailInput.fill(`failure-${Date.now()}@example.com`);
        await consentCheckbox.check({ force: true });
        await expect(submitButton).toBeEnabled();

        const intent = page.waitForResponse(WAITLIST_API);
        await submitButton.click();
        await intent;

        await expect(page.locator('[data-ll="wl-error"]').first()).toBeVisible();
      } finally {
        await page.unroute(WAITLIST_API);
      }
    });
  }
});
