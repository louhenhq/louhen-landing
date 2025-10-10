import { expect, test } from '@tests/fixtures/playwright';
import type { SupportedLocale } from '@/next-intl.locales';
import { methodPath } from '@lib/shared/routing/method-path';
import { imprintPath } from '@lib/shared/routing/imprint-path';
import { waitlistLandingPath } from '@lib/shared/routing/waitlist-path';
import { OG_IMAGE_MAX_BYTES } from '@lib/shared/og/builder';
import { getTestLocales } from '../_utils/url';

type Surface = {
  name: string;
  key: string;
  pathForLocale: (locale: SupportedLocale) => string;
  requiresLocaleCookie?: boolean;
};

const surfaces: Surface[] = [
  {
    name: 'method',
    key: 'method',
    pathForLocale: (locale) => methodPath(locale),
  },
  {
    name: 'waitlist',
    key: 'waitlist',
    pathForLocale: () => waitlistLandingPath(),
    requiresLocaleCookie: true,
  },
  {
    name: 'imprint',
    key: 'imprint',
    pathForLocale: (locale) => imprintPath(locale),
  },
];

const testLocales = (() => {
  const locales = getTestLocales();
  if (locales.length <= 2) return locales as SupportedLocale[];
  const unique = new Set<SupportedLocale>();
  for (const locale of locales) {
    unique.add(locale as SupportedLocale);
    if (unique.size === 2) break;
  }
  return Array.from(unique);
})();

test.describe('OG images – dynamic mode', () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/og-mode', {
      data: { mode: 'dynamic' },
    });
  });

  test.afterEach(async ({ request }) => {
    await request.post('/api/test/og-mode', {
      data: { mode: 'auto' },
    });
  });

  for (const surface of surfaces) {
    test(`${surface.name} surfaces expose valid OG images (dynamic)`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const { hostname } = new URL(page.url());

      for (const locale of testLocales) {
        if (surface.requiresLocaleCookie) {
          await page.context().addCookies([
            {
              name: 'NEXT_LOCALE',
              value: locale,
              domain: hostname,
              path: '/',
            },
          ]);
        }

        const path = surface.pathForLocale(locale);
        await page.goto(path, { waitUntil: 'networkidle' });

        const ogImageUrl = await page.getAttribute('meta[property="og:image"]', 'content');
        expect(ogImageUrl, `${surface.name} (${locale}) should define og:image`).toBeTruthy();

        const twitterImageUrl = await page.getAttribute('meta[name="twitter:image"]', 'content');
        expect(twitterImageUrl, `${surface.name} (${locale}) should define twitter:image`).toBeTruthy();

        for (const urlValue of [ogImageUrl, twitterImageUrl]) {
          if (!urlValue) continue;
          const parsed = new URL(urlValue);
          expect(parsed.protocol).toMatch(/^https?:$/);
          expect(parsed.pathname).toContain('/opengraph-image');
          expect(parsed.searchParams.get('locale')).toBe(locale);
          expect(parsed.searchParams.get('key')).toBe(surface.key);

          const response = await page.request.get(parsed.toString());
          expect(response.status(), `${urlValue} should return 200`).toBe(200);
          const buffer = await response.body();
          expect(buffer.byteLength).toBeGreaterThan(0);
          expect(buffer.byteLength).toBeLessThanOrEqual(OG_IMAGE_MAX_BYTES);
          const contentType = response.headers()['content-type'] ?? '';
          expect(contentType.startsWith('image/')).toBeTruthy();
        }
      }
    });
  }
});
