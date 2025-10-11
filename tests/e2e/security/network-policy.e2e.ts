import { expect, test } from '@tests/fixtures/playwright';

test.describe('Network policy', () => {
  test('blocks external requests by default @smoke', async ({ page, networkPolicy }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');

    const result = await page.evaluate(async () => {
      try {
        await fetch('https://example.com', { mode: 'no-cors' });
        return 'succeeded';
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    });

    expect(result).not.toBe('succeeded');
    const blocked = networkPolicy.getBlockedRequests();
    expect(blocked.some((url) => url.includes('https://example.com'))).toBe(true);
    networkPolicy.clearBlockedRequests();
  });
});
