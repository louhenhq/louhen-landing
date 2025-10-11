import { expect, test } from '@tests/fixtures/playwright';
import { localeUrl } from '../_utils/url';

test.describe('Consent (unknown)', () => {
  test('shows banner and blocks analytics transport', async ({ consentUnknown, page }) => {
    await consentUnknown();

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
    await expect(page.getByRole('dialog', { name: /cookies/i })).toBeVisible();

    await expect.poll(() => analyticsRequests.length).toBe(0);

    await page.goto(localeUrl('/method'), { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
    await expect(page.getByRole('dialog', { name: /cookies/i })).toBeVisible();

    await expect.poll(() => analyticsRequests.length).toBe(0);

    await page.unroute('**/api/track');
  });
});
