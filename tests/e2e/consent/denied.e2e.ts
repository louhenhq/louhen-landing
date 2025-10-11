import { expect, test } from '@tests/fixtures/playwright';
import { localeUrl } from '../_utils/url';

test.describe('Consent (denied)', () => {
  test('keeps analytics suppressed across navigation', async ({ consentDenied, page }) => {
    await consentDenied();

    const analyticsRequests: Array<{ url: string; body?: string }> = [];
    await page.route('**/api/track', async (route) => {
      const request = route.request();
      analyticsRequests.push({
        url: request.url(),
        body: request.postData() ?? undefined,
      });
      await route.continue();
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
    await expect(page).toHaveURL(/\/de-de\/?$/);
    await expect(page.getByRole('dialog', { name: /cookies/i })).toHaveCount(0);

    await expect.poll(() => analyticsRequests.length).toBe(0);

    await page.goto(localeUrl('/method'), { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
    await expect.poll(() => analyticsRequests.length).toBe(0);

    const headerCta = page.getByTestId('lh-nav-cta-primary');
    await expect(headerCta).toBeVisible();
    await headerCta.click({ force: true });
    await expect.poll(() => analyticsRequests.length).toBe(0);

    await page.unroute('**/api/track');
  });
});
