import type { Route } from '@playwright/test';
import { expect, test } from '@tests/fixtures/playwright';
import { runAxe } from '@tests/fixtures/axe';
import { byTestId, testIds } from '@tests/e2e/_utils/selectors';
import { WAITLIST_API_PATTERN, isWaitlistApiUrl } from '@tests/e2e/_utils/waitlistApi';
import { getDefaultLocale, localeUrl } from '@tests/e2e/_utils/url';

const defaultLocale = getDefaultLocale();
const secondaryLocale = defaultLocale === 'en-de' ? 'de-de' : 'en-de';
const locales = [defaultLocale, secondaryLocale];

test.describe('@critical waitlist happy path', () => {
  for (const locale of locales) {
    test(`submits waitlist form and validates success state (${locale}) @critical`, async ({ page }, testInfo) => {
      const context = page.context();
      const waitlistHandler = async (route: Route) => {
        const url = route.request().url();
        if (!isWaitlistApiUrl(url) || route.request().method().toUpperCase() !== 'POST') {
          if (typeof route.fallback === 'function') {
            await route.fallback();
          } else {
            await route.continue();
          }
          return;
        }
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ok: true }),
        });
      };

      await context.route(WAITLIST_API_PATTERN, waitlistHandler);

      try {
        const targetPath = localeUrl('/waitlist', { locale });
        await page.goto(targetPath, { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId(testIds.waitlist.form)).toBeVisible();

        const emailInput = page.getByTestId(testIds.waitlist.emailInput);
        const consentCheckbox = page.getByTestId(testIds.waitlist.consentCheckbox);
        const submitButton = page.getByTestId(testIds.waitlist.submitButton);

        const email = `playwright-${locale}-${Date.now()}@example.com`;
        await emailInput.fill(email);
        await consentCheckbox.check({ force: true });
        await expect(submitButton).toBeEnabled();

        const submissionResponse = await Promise.all([
          page.waitForResponse(
            (response) => response.request().method() === 'POST' && isWaitlistApiUrl(response.url())
          ),
          submitButton.click(),
        ]).then(([response]) => response);

        expect(submissionResponse.ok(), 'Mocked waitlist submission should resolve successfully').toBeTruthy();
        expect(submissionResponse.status()).toBe(200);

        const successContainer = page.getByTestId(testIds.waitlist.successState);
        await expect(successContainer).toBeVisible();
        await expect(successContainer).toHaveAttribute('role', 'status');
        await expect(page.locator(byTestId(testIds.waitlist.serverError))).toHaveCount(0);

        const successHeading = successContainer.locator('h3').first();
        await expect(successHeading).toBeVisible();
        await expect(successHeading).toBeFocused({ timeout: 2000 });

        await expect(page.getByTestId(testIds.waitlist.card).locator('[aria-busy="true"]')).toHaveCount(0);

        await runAxe(page, testInfo, {
          route: targetPath,
          locale,
          viewport: 'desktop',
          disabledRules: ['target-size'],
        });

        await expect(successContainer.locator('a[target="_blank"]')).toHaveCount(0);
      } finally {
        await context.unroute(WAITLIST_API_PATTERN, waitlistHandler);
      }
    });
  }
});
