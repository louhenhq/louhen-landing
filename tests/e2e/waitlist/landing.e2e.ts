import { expect, test } from '@tests/fixtures/playwright';
import { getDefaultLocale, getTestLocales, localeUrl } from '@tests/e2e/_utils/url';

const locales = getTestLocales();
const WAITLIST_API = '**/api/waitlist';
const defaultLocale = getDefaultLocale();

test.describe('Waitlist form (waitlist page)', () => {
  for (const locale of locales) {
    test(`${locale} submits with consent @critical`, async ({ page }) => {
      await page.route(WAITLIST_API, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      });

      try {
        await page.goto(localeUrl('/waitlist', { locale }), { waitUntil: 'domcontentloaded' });

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

    test(`${locale} surfaces server errors @extended`, async ({ page }) => {
      await page.route(WAITLIST_API, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ ok: false, message: 'server_error' }),
        });
      });

      try {
        await page.goto(localeUrl('/waitlist', { locale }), { waitUntil: 'domcontentloaded' });

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

test.describe('@mobile waitlist mobile smoke', () => {
  test('renders waitlist form on mobile view @smoke', async ({ page }) => {
    await page.goto(localeUrl('/waitlist', { locale: defaultLocale }), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-ll="wl-form"]').first()).toBeVisible();
    await expect(page.locator('[data-ll="wl-submit"]').first()).toBeVisible();
  });
});

test.describe('Waitlist urgency badge flag', () => {
  const urgencyCopy = 'Limited early access available';

  test('toggles urgency badge via feature flag @extended', async ({ page, flags }) => {
    await flags.set({ BANNER_WAITLIST_URGENCY: false });
    await page.goto(localeUrl('/waitlist', { locale: defaultLocale }), { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(urgencyCopy, { exact: false })).toHaveCount(0);

    await flags.set({ BANNER_WAITLIST_URGENCY: true });
    const cacheBuster = `?t=${Date.now()}`;
    await page.goto(localeUrl(`/waitlist${cacheBuster}`, { locale: defaultLocale }), { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(urgencyCopy, { exact: false })).toBeVisible();
  });
});
