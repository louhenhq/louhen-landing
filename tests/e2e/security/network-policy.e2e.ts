import { expect, test } from '@tests/fixtures/playwright';

test.describe('Network policy', () => {
  test.beforeEach(({ networkPolicy }) => {
    networkPolicy.clearBlockedRequests();
  });

  test.afterEach(({ networkPolicy }) => {
    networkPolicy.clearBlockedRequests();
  });

  test('blocks external requests by default @smoke', async ({ page, networkPolicy }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');

    await page.evaluate(async () => {
      await fetch('https://example.com/__np_probe', { mode: 'no-cors' }).catch(() => null);
    });
    const blocked = networkPolicy.getBlockedRequests();
    expect(blocked.some((url) => url.includes('https://example.com'))).toBe(true);
  });
});
