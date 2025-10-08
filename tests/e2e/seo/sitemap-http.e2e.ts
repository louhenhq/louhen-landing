import { expect, test } from '@tests/fixtures/playwright';
import type { SupportedLocale } from '@/next-intl.locales';
import { getTestLocales, localeUrl } from '../_utils/url';
import { makeCanonical, resolveBaseUrl } from '@lib/seo/shared';
import { canonicalPathsForLocale, sitemapSlugForLocale } from '@lib/shared/seo/sitemap';

const MAX_PAGES_PER_LOCALE = Number(process.env.SEO_SITEMAP_SAMPLE ?? '5');
const testLocales = getTestLocales();
const baseUrl = resolveBaseUrl();
const ACCEPTABLE_STATUSES = new Set([200, 401, 403]);

function pickSample<T>(items: T[], limit: number): T[] {
  if (items.length <= limit) return items;
  const first = items[0];
  const last = items[items.length - 1];
  const middle = items[Math.floor(items.length / 2)];
  const unique = Array.from(new Set([first, middle, last]));
  const remaining = items.filter((item) => !unique.includes(item));
  return [...unique, ...remaining.slice(0, Math.max(0, limit - unique.length))];
}

function asRelative(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

test.describe('SEO sitemap/OG integrity', () => {
  test('sitemap index and sampled URLs respond with acceptable status', async ({ request }) => {
    const sitemapIndex = await request.get('/sitemap.xml');
    expect(sitemapIndex.status()).toBe(200);
    const indexBody = await sitemapIndex.text();

    for (const rawLocale of testLocales) {
      const locale = rawLocale as SupportedLocale;
      const slug = sitemapSlugForLocale(locale);
      const sitemapPath = `/sitemaps/${slug}.xml`;
      expect(indexBody).toContain(`<loc>${baseUrl}${sitemapPath}</loc>`);

      const localeResponse = await request.get(sitemapPath);
      expect(localeResponse.status()).toBe(200);
      const localeBody = await localeResponse.text();
      const expectedPaths = canonicalPathsForLocale(locale);
      const sample = pickSample(expectedPaths, MAX_PAGES_PER_LOCALE);

      for (const path of sample) {
        const canonical = makeCanonical(path, baseUrl);
        expect(localeBody).toContain(`<loc>${canonical}</loc>`);
        const response = await request.get(canonical);
        expect(ACCEPTABLE_STATUSES.has(response.status())).toBeTruthy();
        if (response.status() !== 200) {
          const snippet = (await response.text()).slice(0, 120).replace(/\s+/g, ' ').trim();
          test.info().annotations.push({
            type: 'warning',
            description: `${canonical} responded ${response.status()}: ${snippet}`,
          });
        }
      }
    }
  });

  test('OG images for representative pages return 200', async ({ request }) => {
    const targets = [
      localeUrl('/method'),
      localeUrl('/waitlist', { locale: testLocales[0] }),
      localeUrl('/legal/privacy'),
    ];

    for (const target of targets) {
      const pageResponse = await request.get(asRelative(target));
      expect(pageResponse.status()).toBe(200);
      const document = await pageResponse.text();
      const ogImageMatch = document.match(/<meta[^>]+property="og:image"[^>]+content="([^\"]+)"/i);
      const twitterImageMatch = document.match(/<meta[^>]+name="twitter:image"[^>]+content="([^\"]+)"/i);
      const imageUrls = [ogImageMatch?.[1], twitterImageMatch?.[1]].filter((value): value is string => !!value);
      expect(imageUrls.length).toBeGreaterThan(0);

      for (const imageUrl of imageUrls) {
        const imageResponse = await request.get(asRelative(imageUrl));
        expect(imageResponse.status()).toBe(200);
      }
    }
  });
});

