import { expect, test } from '@tests/fixtures/playwright';
import type { Page } from '@playwright/test';
import { localeUrl } from '../_utils/url';

type CapturedEvent = {
  name?: unknown;
  mode?: unknown;
  [key: string]: unknown;
};

async function seedAuthHintCookies(page: Page) {
  const consentValue = encodeURIComponent(`v1:granted`);
  const hosts = ['localhost', '127.0.0.1'];
  await page.context().addCookies(
    hosts.flatMap((domain) => [
      { name: 'LH_AUTH', value: '1', domain, path: '/' },
      { name: 'll_consent', value: consentValue, domain, path: '/' },
    ])
  );
}

test.describe('Header user state awareness', () => {
  test('guest experience keeps waitlist CTA and hides logout link', async ({ page }) => {
    await page.goto(localeUrl('?utm_source=user-state-guest'), { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-ll="nav-waitlist-cta"]').first()).toHaveText('Join the waitlist');
    await expect(page.getByTestId('header-logout')).toHaveCount(0);
  });

  test('hinted state swaps CTA, shows logout, and annotates analytics with user_state', async ({ page }) => {
    await seedAuthHintCookies(page);

    const captured: CapturedEvent[] = [];
    await page.route('**/api/track', async (route) => {
      const body = route.request().postData();
      try {
        if (body) {
          captured.push(JSON.parse(body) as CapturedEvent);
        } else {
          captured.push({});
        }
      } catch {
        captured.push({});
      }
      await route.fulfill({ status: 204, body: '' });
    });

    await page.goto(localeUrl('?utm_source=user-state-hinted'), { waitUntil: 'domcontentloaded' });

    const dashboardCta = page.locator('[data-ll="nav-waitlist-cta"]').first();
    await expect(dashboardCta).toHaveText('Dashboard');

    const logoutLink = page.getByTestId('header-logout');
    await expect(logoutLink).toBeVisible();

    await page.evaluate(() => {
      const cta = document.querySelector('[data-ll="nav-waitlist-cta"]');
      if (cta instanceof HTMLAnchorElement) {
        cta.setAttribute('href', '#');
      }
      const logout = document.querySelector('[data-testid="header-logout"]');
      if (logout instanceof HTMLAnchorElement) {
        logout.setAttribute('href', '#');
      }
    });

    await dashboardCta.click({ noWaitAfter: true });
    await logoutLink.click({ noWaitAfter: true });

    const headerCtaEvents = () =>
      captured.filter((event): event is CapturedEvent & { name: string } => event.name === 'header_cta_click');

    await expect.poll(() => headerCtaEvents().length).toBeGreaterThanOrEqual(2);

    const userStates = headerCtaEvents()
      .map((event) => event['user_state'])
      .filter((value): value is string => typeof value === 'string');

    expect(userStates).toContain('hinted');
    expect(captured.some((event) => event.mode === 'authenticated')).toBe(true);
  });
});
