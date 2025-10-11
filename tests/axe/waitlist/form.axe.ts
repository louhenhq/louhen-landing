import { expect, test } from '@tests/fixtures/playwright';
import { runAxe } from '@tests/fixtures/axe';
import { getDefaultLocale, localeUrl, setLocaleCookie } from '@tests/e2e/_utils/url';

const locale = getDefaultLocale();

test.describe('Waitlist form — accessibility', () => {
  test('labels, error relationships, and axe', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await setLocaleCookie(page.context(), locale);
    await page.goto(localeUrl('/waitlist', { locale }), { waitUntil: 'domcontentloaded' });

    const form = page.locator('[data-ll="wl-form"]').first();
    await expect(form).toBeVisible();

    const emailInput = page.getByTestId('wl-email-input');
    await expect(emailInput).toHaveAttribute('id', 'waitlist-email');
    await expect(page.locator('label[for="waitlist-email"]')).not.toHaveText('');

    const consentCheckbox = page.getByTestId('wl-consent-checkbox');
    await expect(consentCheckbox).toHaveAttribute('id', 'waitlist-consent');
    await expect(page.locator('label[for="waitlist-consent"]')).not.toHaveText('');

    await page.locator('[data-ll="wl-submit"]').click();

    await expect(emailInput).toHaveAttribute('aria-describedby', /waitlist-email-error/);
    await expect(consentCheckbox).toHaveAttribute('aria-describedby', /waitlist-consent-error/);

    const captchaError = page.locator('#waitlist-captcha-error');
    if (await captchaError.count()) {
      await expect(captchaError).toBeVisible();
    }

    await runAxe(page, testInfo, { route: 'waitlist-form', locale, viewport: 'desktop' });
  });
});
