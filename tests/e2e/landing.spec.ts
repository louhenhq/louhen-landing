import { expect, test } from '@tests/fixtures/playwright';
import { setLocaleCookie } from './_utils/url';

test.describe('Landing analytics sentinel', () => {
  test('consent gating blocks analytics until accepted', async ({ context, page }) => {
    await context.clearCookies();
    await setLocaleCookie(context);
    await page.setViewportSize({ width: 1280, height: 900 });

    let trackCalls = 0;
    await page.route('**/api/track', async (route) => {
      trackCalls += 1;
      await route.fulfill({ status: 204, body: '{}' });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
    await expect(page).toHaveURL(/\/de-de\/?$/);

    const analyticsReadyInitial = await page.evaluate(() => window.__LOUHEN_ANALYTICS_READY === true);
    expect(analyticsReadyInitial).toBe(false);

    const consentDialog = page.getByRole('dialog', { name: /cookies/i });
    await expect(consentDialog).toBeVisible();

    const headerCta = page.getByTestId('lh-nav-cta-primary');
    await expect(headerCta).toBeVisible();
    await headerCta.scrollIntoViewIfNeeded();
    await headerCta.click({ force: true });
    expect(trackCalls).toBe(0);

    await page.getByRole('button', { name: /Accept all/i }).click();
    await expect.poll(() => page.evaluate(() => window.__LOUHEN_ANALYTICS_READY === true)).toBeTruthy();
    await expect(consentDialog).toHaveCount(0);

    await headerCta.click({ force: true });
    await expect
      .poll(() => trackCalls, { message: 'Expected analytics payload after consent' })
      .toBeGreaterThan(0);

    await page.unroute('**/api/track');
  });
});
