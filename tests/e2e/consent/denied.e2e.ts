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

    await page.goto(localeUrl(), { waitUntil: 'networkidle' });
    await expect(page.getByRole('dialog', { name: /cookies/i })).toHaveCount(0);

    await page.waitForTimeout(500);
    expect(analyticsRequests).toHaveLength(0);

    await page.goto(localeUrl('/method'), { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    expect(analyticsRequests).toHaveLength(0);

    const headerCta = page.locator('[data-ll="nav-waitlist-cta"]').first();
    await headerCta.waitFor();
    await headerCta.click({ force: true });
    await page.waitForTimeout(500);
    expect(analyticsRequests).toHaveLength(0);

    await page.unroute('**/api/track');
  });
});
