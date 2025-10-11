import { expect, test } from '@tests/fixtures/playwright';

type AnalyticsEvent = {
  name?: string;
  [key: string]: unknown;
};

test.describe('Consent (granted)', () => {
  test('initialises analytics and flushes queued events', async ({ consentGranted, page }) => {
    await consentGranted();

    const analyticsEvents: AnalyticsEvent[] = [];
    await page.route('**/api/track', async (route) => {
      const request = route.request();
      const body = request.postData();
      if (body) {
        try {
          analyticsEvents.push(JSON.parse(body));
        } catch {
          analyticsEvents.push({ raw: body });
        }
      } else {
        analyticsEvents.push({});
      }
      await route.continue();
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
    await expect(page).toHaveURL(/\/de-de\/?$/);

    await expect(page.getByRole('dialog', { name: /cookies/i })).toHaveCount(0);
    await expect
      .poll(() => analyticsEvents.length, { message: 'Expected initial page_view event after consent' })
      .toBe(1);
    expect(analyticsEvents[0]?.name).toBe('page_view');

    const headerCta = page.getByTestId('lh-nav-cta-primary');
    await expect(headerCta).toBeVisible();
    await headerCta.click({ force: true });

    await expect
      .poll(() => analyticsEvents.length, { message: 'Expected header CTA click to emit analytics event' })
      .toBeGreaterThanOrEqual(2);

    const lastEvent = analyticsEvents.at(-1);
    expect(typeof lastEvent?.name).toBe('string');
    expect(lastEvent?.name).not.toBe('page_view');

    await page.unroute('**/api/track');
  });
});
