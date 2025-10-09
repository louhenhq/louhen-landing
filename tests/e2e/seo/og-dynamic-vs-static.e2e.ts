import { expect, test } from '@tests/fixtures/playwright';
import { OG_IMAGE_MAX_BYTES } from '@lib/shared/og/builder';

test.describe('OG dynamic vs static fallback', () => {
  test('feature flag toggles between dynamic and static OG images', async ({ page, request }) => {
    await request.post('/api/test/og-mode', { data: { mode: 'dynamic' } });

    try {
      await page.goto('/waitlist', { waitUntil: 'networkidle' });
      const dynamicOg = await page.getAttribute('meta[property="og:image"]', 'content');
      expect(dynamicOg).toBeTruthy();
      expect(dynamicOg).toContain('/opengraph-image');
      if (dynamicOg) {
        const dynamicUrl = new URL(dynamicOg);
        expect(dynamicUrl.searchParams.get('key')).toBe('waitlist');
      }

      if (dynamicOg) {
        const response = await page.request.get(dynamicOg);
        expect(response.status()).toBe(200);
        const buffer = await response.body();
        expect(buffer.byteLength).toBeGreaterThan(0);
        expect(buffer.byteLength).toBeLessThanOrEqual(OG_IMAGE_MAX_BYTES);
      }

      await request.post('/api/test/og-mode', { data: { mode: 'static' } });
      const cacheBuster = `?t=${Date.now()}`;
      await page.goto(`/waitlist${cacheBuster}`, { waitUntil: 'networkidle' });
      const staticOg = await page.getAttribute('meta[property="og:image"]', 'content');
      expect(staticOg).toBeTruthy();
      expect(staticOg).not.toContain('/opengraph-image');
      expect(staticOg).toContain('/og/');

      if (staticOg) {
        const parsed = new URL(staticOg);
        const response = await page.request.get(parsed.toString());
        expect(response.status()).toBe(200);
        const buffer = await response.body();
        expect(buffer.byteLength).toBeGreaterThan(0);
        expect(buffer.byteLength).toBeLessThanOrEqual(OG_IMAGE_MAX_BYTES);
        expect(parsed.pathname.split('/')).toContain('og');
      }
    } finally {
      await request.post('/api/test/og-mode', { data: { mode: 'auto' } });
    }
  });
});
