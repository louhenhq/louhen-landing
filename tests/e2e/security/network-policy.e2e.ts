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

    // Clear previous records to avoid false positives
    networkPolicy.clearBlockedRequests();

    // Race the cross-origin navigation with the expected requestfailed event
    const requestFailed = page.waitForEvent(
      'requestfailed',
      (r) => r.url().startsWith(baseProbeUrl),
      { timeout: 10_000 }
    );

    // Navigate to the probe URL to trigger the external request
    await page.goto(probeUrl).catch(() => null);
    await requestFailed;

    // Confirm the external request was recorded as blocked
    await expect
      .poll(() => networkPolicy.getBlockedRequests().some((url) => url.includes('https://example.com')))
      .toBeTruthy();
  });
});
