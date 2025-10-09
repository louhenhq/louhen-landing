import { expect, test } from '@tests/fixtures/playwright';
import type { Locator, Page } from '@playwright/test';
import { localeUrl } from '../_utils/url';

async function focusWithTab(page: Page, target: Locator): Promise<void> {
  for (let i = 0; i < 15; i += 1) {
    if (await target.isFocused()) {
      await expect(target).toBeFocused();
      return;
    }
    await page.keyboard.press('Tab');
  }
  await expect(target).toBeFocused();
}

test.describe('Waitlist form — keyboard errors', () => {
  test('focuses first invalid control and exposes error descriptions', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(localeUrl('/waitlist'), { waitUntil: 'networkidle' });

    const emailInput = page.getByTestId('wl-email-input');
    const consentCheckbox = page.getByTestId('wl-consent-checkbox');
    const submitButton = page.locator('[data-ll="wl-submit"]');

    await focusWithTab(page, emailInput);
    await page.keyboard.press('Enter');

    await expect(emailInput).toBeFocused();
    await expect(page.locator('#waitlist-email-error')).toBeVisible();
    await expect(emailInput).toHaveAttribute('aria-describedby', /waitlist-email-error/);

    await emailInput.fill('louhen@example.com');
    await expect(page.locator('#waitlist-email-error')).toHaveCount(0);

    await page.keyboard.press('Enter');

    await expect(consentCheckbox).toBeFocused();
    await expect(page.locator('#waitlist-consent-error')).toBeVisible();
    await expect(consentCheckbox).toHaveAttribute('aria-describedby', /waitlist-consent-error/);

    await page.keyboard.press('Space');
    await expect(page.locator('#waitlist-consent-error')).toHaveCount(0);

    await focusWithTab(page, submitButton);
    await page.keyboard.press('Enter');

    const success = page.locator('[data-ll="wl-success"]');
    if (await success.count()) {
      await expect(success).toBeVisible();
      return;
    }

    const captchaError = page.locator('#waitlist-captcha-error');
    if (await captchaError.count()) {
      await expect(captchaError).toBeVisible();
      await expect(page.locator('[data-ll="wl-captcha"]')).toBeFocused();
      return;
    }

    // If neither condition is met, ensure at least the form surface reported an error summary.
    await expect(page.locator('#waitlist-error-summary')).toBeVisible();
  });
});
