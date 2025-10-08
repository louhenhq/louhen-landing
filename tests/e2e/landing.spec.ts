import { expect, test } from '@tests/fixtures/playwright';
import { localeUrl } from './_utils/url';

test.describe('Landing analytics sentinel', () => {
  test('consent gating blocks analytics until accepted', async ({ context, page }) => {
    await context.clearCookies();
    await page.setViewportSize({ width: 1280, height: 900 });

    let trackCalls = 0;
    await page.route('**/api/track', async (route) => {
      trackCalls += 1;
      await route.fulfill({ status: 204, body: '{}' });
    });

    await page.goto(localeUrl(), { waitUntil: 'networkidle' });

    const analyticsReadyInitial = await page.evaluate(() => window.__LOUHEN_ANALYTICS_READY === true);
    expect(analyticsReadyInitial).toBe(false);

    const consentDialog = page.getByRole('dialog', { name: /cookies/i });
    await expect(consentDialog).toBeVisible();

    const headerCta = page.getByTestId('header-cta');
    await headerCta.waitFor();
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
}
