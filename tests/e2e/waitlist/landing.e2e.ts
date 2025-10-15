import type { Route } from '@playwright/test';
import { expect, test } from '@tests/fixtures/playwright';
import { getDefaultLocale, getTestLocales, localeUrl } from '@tests/e2e/_utils/url';
import { testIds, byTestId } from '@tests/e2e/_utils/selectors';
import { WAITLIST_API_PATTERN, isWaitlistApiUrl } from '@tests/e2e/_utils/waitlistApi';

const locales = getTestLocales();
const defaultLocale = getDefaultLocale();

test.describe('Waitlist form (waitlist page)', () => {
  for (const locale of locales) {
    test(`${locale} submits with consent`, async ({ page }) => {
      const context = page.context();
      const waitlistHandler = async (route: Route) => {
        if (!isWaitlistApiUrl(route.request().url())) {
          if (typeof route.fallback === 'function') {
            await route.fallback();
          } else {
            await route.continue();
          }
          return;
        }
        if (route.request().method().toUpperCase() !== 'POST') {
          if (typeof route.fallback === 'function') {
            await route.fallback();
          } else {
            await route.continue();
          }
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      };
      await context.route(WAITLIST_API_PATTERN, waitlistHandler);

      await page.goto(localeUrl('/waitlist', { locale }), { waitUntil: 'domcontentloaded' });

      const form = page.getByTestId(testIds.waitlist.form);
      await expect(form).toBeVisible();

      const emailInput = page.getByTestId(testIds.waitlist.emailInput);
      const consentCheckbox = page.getByTestId(testIds.waitlist.consentCheckbox);
      const submitButton = page.getByTestId(testIds.waitlist.submitButton);

      await expect(submitButton).toBeDisabled();

      await emailInput.fill(`playwright-${Date.now()}@example.com`);
      await expect(submitButton).toBeDisabled();

      await consentCheckbox.check({ force: true });
      await expect(submitButton).toBeEnabled();

      await Promise.all([
        page.waitForResponse(
          (response) => response.request().method() === 'POST' && isWaitlistApiUrl(response.url())
        ),
        submitButton.click(),
      ]);

      await expect(page.getByTestId(testIds.waitlist.successState)).toBeVisible();
      await expect(page.locator(byTestId(testIds.waitlist.serverError))).toHaveCount(0);
    });

    test(`${locale} surfaces server errors @extended`, async ({ page }) => {
      const context = page.context();
      const waitlistHandler = async (route: Route) => {
        if (!isWaitlistApiUrl(route.request().url())) {
          if (typeof route.fallback === 'function') {
            await route.fallback();
          } else {
            await route.continue();
          }
          return;
        }
        if (route.request().method().toUpperCase() !== 'POST') {
          if (typeof route.fallback === 'function') {
            await route.fallback();
          } else {
            await route.continue();
          }
          return;
        }
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ ok: false, message: 'server_error' }),
        });
      };
      await context.route(WAITLIST_API_PATTERN, waitlistHandler);

      await page.goto(localeUrl('/waitlist', { locale }), { waitUntil: 'domcontentloaded' });

      const emailInput = page.getByTestId(testIds.waitlist.emailInput);
      const consentCheckbox = page.getByTestId(testIds.waitlist.consentCheckbox);
      const submitButton = page.getByTestId(testIds.waitlist.submitButton);

      await emailInput.fill(`failure-${Date.now()}@example.com`);
      await consentCheckbox.check({ force: true });
      await expect(submitButton).toBeEnabled();

      await Promise.all([
        page.waitForResponse(
          (response) => response.request().method() === 'POST' && isWaitlistApiUrl(response.url())
        ),
        submitButton.click(),
      ]);

      await expect(page.getByTestId(testIds.waitlist.serverError)).toBeVisible();
    });
  }
});

test.describe('@mobile waitlist mobile smoke', () => {
  test('renders waitlist form on mobile view @smoke', async ({ page }) => {
    await page.goto(localeUrl('/waitlist', { locale: defaultLocale }), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const form = page.getByTestId(testIds.waitlist.form);
    await form.waitFor({ state: 'attached' });
    await form.scrollIntoViewIfNeeded();
    await expect(form).toBeVisible({ timeout: 10_000 });

    const submit = page.getByTestId(testIds.waitlist.submitButton);
    await submit.waitFor({ state: 'attached' });
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeVisible({ timeout: 10_000 });
  });
});

test.afterEach(async ({ page }) => {
  await page.context().unroute(WAITLIST_API_PATTERN);
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
