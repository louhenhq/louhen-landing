import { expect, test } from '@tests/fixtures/playwright';
import { OG_IMAGE_MAX_BYTES } from '@lib/shared/og/builder';

test.describe('OG static fallback (flag off)', () => {
  test('@og static fallback serves pre-rendered images when dynamic OG is disabled', async ({ page }) => {
    test.skip(process.env.OG_DYNAMIC_ENABLED !== 'false', 'Static fallback test only runs when OG dynamic is disabled.');

    const cacheBuster = `?static=${Date.now()}`;
    await page.goto(`/waitlist${cacheBuster}`, { waitUntil: 'networkidle' });
    const staticOg = await page.getAttribute('meta[property="og:image"]', 'content');
    expect(staticOg).toBeTruthy();
    expect(staticOg).not.toContain('/opengraph-image');

    if (staticOg) {
      const parsed = new URL(staticOg);
      const response = await page.request.get(parsed.toString());
      expect(response.status()).toBe(200);
      const buffer = await response.body();
      expect(buffer.byteLength).toBeGreaterThan(0);
      expect(buffer.byteLength).toBeLessThanOrEqual(OG_IMAGE_MAX_BYTES);
      expect(parsed.pathname.split('/')).toContain('og');
    }
  });
});
