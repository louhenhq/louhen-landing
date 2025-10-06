import { expect, test } from '@playwright/test';

async function seedAuthHintCookies(page: import('@playwright/test').Page) {
  const timestamp = new Date().toISOString();
  const consentValue = encodeURIComponent(JSON.stringify({ analytics: true, marketing: false, timestamp }));
  const hosts = ['localhost', '127.0.0.1'];
  await page.context().addCookies(
    hosts.flatMap((domain) => [
      { name: 'LH_AUTH', value: '1', domain, path: '/' },
      { name: 'louhen_consent', value: consentValue, domain, path: '/' },
    ])
  );
}

test.describe('Header user state awareness', () => {
  test('guest experience keeps waitlist CTA and hides logout link', async ({ page }) => {
    await page.goto('/en?utm_source=user-state-guest', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('header-cta')).toHaveText('Join the waitlist');
    await expect(page.getByTestId('header-logout')).toHaveCount(0);
  });

  test('hinted state swaps CTA, shows logout, and annotates analytics with user_state', async ({ page }) => {
    await seedAuthHintCookies(page);

    const captured: any[] = [];
    await page.route('**/api/track', async (route) => {
      const body = route.request().postData();
      try {
        if (body) {
          captured.push(JSON.parse(body));
        } else {
          captured.push({});
        }
      } catch {
        captured.push({});
      }
      await route.fulfill({ status: 204, body: '' });
    });

    await page.goto('/en?utm_source=user-state-hinted', { waitUntil: 'networkidle' });

    const dashboardCta = page.getByTestId('header-cta');
    await expect(dashboardCta).toHaveText('Dashboard');

    const logoutLink = page.getByTestId('header-logout');
    await expect(logoutLink).toBeVisible();

    await page.evaluate(() => {
      const cta = document.querySelector('[data-testid="header-cta"]');
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

    await expect
      .poll(() => captured.filter((event) => event.name === 'header_cta_click').length)
      .toBeGreaterThanOrEqual(2);

    const userStates = captured
      .filter((event) => event.name === 'header_cta_click')
      .map((event) => event['user_state']);

    expect(userStates).toContain('hinted');
    expect(captured.some((event) => event.mode === 'authenticated')).toBe(true);
  });
});
