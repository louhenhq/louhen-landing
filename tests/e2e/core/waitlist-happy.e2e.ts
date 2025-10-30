import type { Route } from '@playwright/test';
import { expect, test } from '@tests/fixtures/playwright';
import { runAxe } from '@tests/fixtures/axe';
import { byTestId, testIds } from '@tests/e2e/_utils/selectors';
import { getDefaultLocale, localeUrl } from '@tests/e2e/_utils/url';

const defaultLocale = getDefaultLocale();
const secondaryLocale = defaultLocale === 'en-de' ? 'de-de' : 'en-de';
const locales = [defaultLocale, secondaryLocale];
const WAITLIST_ROUTE_REGEX = /\/api\/(?:testing\/)?waitlist(?:\/|$)/;

test.describe('@critical waitlist happy path', () => {
  for (const locale of locales) {
    test(`submits waitlist form and validates success state (${locale}) @critical`, async ({ page }, testInfo) => {
      const context = page.context();
      let fulfillDone!: () => void;
      const fulfilled = new Promise<void>((resolve) => {
        fulfillDone = resolve;
      });
      const waitlistHandler = async (route: Route) => {
        const request = route.request();
        if (!WAITLIST_ROUTE_REGEX.test(request.url()) || request.method().toUpperCase() !== 'POST') {
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
        fulfillDone();
      };

      await context.route(WAITLIST_ROUTE_REGEX, waitlistHandler);

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

        await submitButton.click();

        await Promise.race([
          fulfilled,
          page.getByRole('status').waitFor({ state: 'visible', timeout: 7_000 }),
        ]);

        await expect(page.getByRole('status')).toBeVisible();

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
        await context.unroute(WAITLIST_ROUTE_REGEX, waitlistHandler);
      }
    });
  }
});
