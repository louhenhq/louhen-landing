import { test, expect } from '@tests/fixtures/playwright';
import { localeUrl } from '../_utils/url';

test.describe('Header consent controls', () => {
  test('opens manager and gates analytics events', async ({ page }) => {
    let trackRequests = 0;
    await page.route('**/api/track', async (route) => {
      trackRequests += 1;
      await route.fulfill({ status: 204, body: '' });
    });

    await page.goto(localeUrl('?utm_source=consent-header'), { waitUntil: 'networkidle' });

    const consentButton = page.getByTestId('header-consent-button-desktop');
    await expect(consentButton).toBeVisible();
    await expect(consentButton).toHaveAttribute('data-consent-state', 'unset');

    await consentButton.click();
    const dialog = page.getByRole('dialog', { name: 'Privacy choices' });
    await expect(dialog).toBeVisible();

    const acceptButton = dialog.getByRole('button', { name: 'Accept all' });
    await expect(acceptButton).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // Trigger header CTA before consent → no analytics call
    await page.locator('[data-ll="nav-waitlist-cta"]').first().click();
    await expect.poll(() => trackRequests).toBe(0);

    // Accept consent
    await consentButton.click();
    await acceptButton.click();
    await expect(consentButton).toHaveAttribute('data-consent-state', 'granted');

    // CTA should now enqueue analytics
    await page.locator('[data-ll="nav-waitlist-cta"]').first().click();
    await expect.poll(() => trackRequests).toBeGreaterThan(0);

    // Revoke consent
    await consentButton.click();
    const rejectButton = page.getByRole('button', { name: 'Reject non-essential' });
    await rejectButton.click();
    await expect(consentButton).toHaveAttribute('data-consent-state', 'denied');

    const priorRequests = trackRequests;
    await page.locator('[data-ll="nav-waitlist-cta"]').first().click();
    await expect.poll(() => trackRequests).toBe(priorRequests);
  });
});
