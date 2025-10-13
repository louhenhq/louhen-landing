import type { Request } from '@playwright/test';
import { expect, test } from '@tests/fixtures/playwright';
import { getDefaultLocale } from './_utils/url';

test.describe('Landing analytics sentinel', () => {
  test('consent gating blocks analytics until accepted @smoke', async ({ context, page }) => {
    await context.clearCookies();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const defaultLocale = getDefaultLocale();

    await page.goto(`/${defaultLocale}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
    await expect(page).toHaveURL(new RegExp(`/${defaultLocale}/?(?:[?#].*)?$`));

    const analyticsReadyInitial = await page.evaluate(() => window.__LOUHEN_ANALYTICS_READY === true);
    expect(analyticsReadyInitial).toBe(false);

    const consentDialog = page.getByRole('dialog', { name: /cookies/i });
    await expect(consentDialog).toBeVisible();
    await expect(consentDialog).toHaveAttribute('data-state', 'open');
    const acceptButton = consentDialog.getByTestId('lh-consent-accept-all');
    await acceptButton.scrollIntoViewIfNeeded();
    await acceptButton.waitFor({ state: 'visible' });
    await expect(acceptButton).toBeVisible();
    await acceptButton.focus();
    await page.keyboard.press('Enter');
    await expect(consentDialog).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => window.__LOUHEN_ANALYTICS_READY === true))
      .toBeTruthy();

    const headerCta = page.getByTestId('lh-nav-cta-primary');
    await expect(headerCta).toBeVisible();
    await headerCta.scrollIntoViewIfNeeded();

    let resolveTrack: ((req: Request) => void) | undefined;
    const trackSeen = new Promise<Request>((resolve) => {
      resolveTrack = resolve;
    });

    await page.route('**/api/track', async (route) => {
      resolveTrack?.(route.request());
      await route.fulfill({ status: 204, body: '{}' });
    });

    await headerCta.click({ noWaitAfter: true });

    const trackRequest = await trackSeen;
    expect(trackRequest.url()).toContain('/api/track');

    await page.unroute('**/api/track');
  });
});
