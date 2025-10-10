import { test, expect } from '@tests/fixtures/playwright';
import { localeUrl } from '../_utils/url';

test.describe('Header CTA modes', () => {
  test('waitlist CTA scrolls to form', async ({ page }) => {
    await page.addInitScript(() => {
      window.__LOUHEN_HEADER_PHASE__ = 'waitlist';
    });
    await page.goto(localeUrl('?utm_source=cta-waitlist'), { waitUntil: 'domcontentloaded' });

    const cta = page.locator('[data-ll="nav-waitlist-cta"]').first();
    await expect(cta).toHaveText('Join the waitlist');
    await cta.click();
    await expect(page.locator('#waitlist-form')).toBeInViewport();
  });

  test('access CTA links to request access', async ({ page }) => {
    await page.addInitScript(() => {
      window.__LOUHEN_HEADER_PHASE__ = 'access';
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/de-de\/?$/);

    const cta = page.locator('[data-ll="nav-waitlist-cta"]').first();
    await expect(cta).toHaveAttribute('href', /onboarding\/request-access\?utm_source=header/);
    await expect(cta).toHaveText('Request access');
  });

  test('download CTA opens download link', async ({ page }) => {
    await page.addInitScript(() => {
      window.__LOUHEN_HEADER_PHASE__ = 'download';
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/de-de\/?$/);

    const cta = page.locator('[data-ll="nav-waitlist-cta"]').first();
    await expect(cta).toHaveAttribute('href', /download\?utm_source=header/);
    await expect(cta).toHaveText('Download the app');
  });
});
