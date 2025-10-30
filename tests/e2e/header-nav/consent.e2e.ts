import { test, expect } from '@tests/fixtures/playwright';
import { localeUrl } from '../_utils/url';

test.describe('Header consent controls', () => {
  test('opens manager and gates analytics events', async ({ page }) => {
    let trackRequests = 0;
    await page.route('**/api/track', async (route) => {
      trackRequests += 1;
      await route.fulfill({ status: 204, body: '' });
    });

    await page.goto(localeUrl('?utm_source=consent-header'), { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');

    const consentButton = page.getByTestId('lh-nav-consent-button-desktop');
    await expect(consentButton).toBeVisible();
    await expect(consentButton).toHaveAttribute('data-consent-state', 'unset');

    await consentButton.click();
    const dialog = page.getByRole('dialog', { name: 'Privacy choices' });
    await expect(dialog).toBeVisible();

    const acceptButton = dialog.getByTestId('lh-consent-accept-all');
    await expect(acceptButton).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // Trigger header CTA before consent → no analytics call
    await page.getByTestId('lh-nav-cta-primary').click();
    await expect.poll(() => trackRequests).toBe(0);

    // Accept consent
    await consentButton.click();
    await acceptButton.click();
    await expect(consentButton).toHaveAttribute('data-consent-state', 'granted');

    // CTA should now enqueue analytics
    await page.getByTestId('lh-nav-cta-primary').click();
    await expect.poll(() => trackRequests).toBeGreaterThan(0);

    // Revoke consent
    await consentButton.click();
    const rejectButton = page.getByRole('button', { name: 'Reject non-essential' });
    await rejectButton.click();
    await expect(consentButton).toHaveAttribute('data-consent-state', 'denied');

    const priorRequests = trackRequests;
    await page.getByTestId('lh-nav-cta-primary').click();
    await expect.poll(() => trackRequests).toBe(priorRequests);
  });
});
