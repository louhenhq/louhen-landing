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

    const baseProbeUrl = 'https://example.com/__np_probe';
    const probeUrl = `${baseProbeUrl}?t=${Date.now()}`;
    await page.evaluate((url) => {
      return fetch(url, { cache: 'no-store' }).catch(() => null);
    }, probeUrl);

    await expect
      .poll(() => networkPolicy.getBlockedRequests().some((url) => url.includes('https://example.com')))
      .toBeTruthy();
  });
});
