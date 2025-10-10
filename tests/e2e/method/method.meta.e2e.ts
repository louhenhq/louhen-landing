import { expect, test } from '@tests/fixtures/playwright';
import { loadMessages } from '@lib/intl/loadMessages';
import { methodPath } from '@lib/shared/routing/method-path';
import { hreflangMapFor, makeCanonical } from '@lib/seo/shared';
import { defaultLocale, type SupportedLocale } from '@/next-intl.locales';
import { sitemapSlugForLocale } from '@lib/shared/seo/sitemap';
import { getTestLocales } from '../_utils/url';

const PRELAUNCH_FLAG =
  (process.env.IS_PRELAUNCH?.trim() === 'true' || process.env.IS_PRELAUNCH?.trim() === '1') ||
  (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production');

type MethodMessages = {
  seo?: {
    title?: string;
    description?: string;
  };
};

const DEFAULT_METHOD_TITLE = 'Method \u2013 Louhen';

const defaultMethodMessagesPromise = loadMessages(defaultLocale).then((messages) => {
  const typed = messages as { method?: MethodMessages };
  return typed.method ?? {};
});

const localesToTest = getTestLocales() as SupportedLocale[];

test.describe('Method page metadata', () => {
  for (const locale of localesToTest) {
    test(`${locale} metadata reflects localized copy and canonical policy`, async ({ page }) => {
      const messages = (await loadMessages(locale)) as { method?: MethodMessages };
      const methodMessages = messages.method ?? {};
      const defaultMethodMessages =
        locale === defaultLocale ? methodMessages : await defaultMethodMessagesPromise;

      const targetPath = methodPath(locale);
      const apiResponse = await page.request.get(targetPath);
      const status = apiResponse.status();
      if (status !== 200) {
        const snippet = (await apiResponse.text()).slice(0, 400);
        console.error(`[method.meta] ${targetPath} returned ${status}. Body preview: ${snippet}`);
      }
      expect(status).toBe(200);

      await page.goto(targetPath, { waitUntil: 'domcontentloaded' });

      const expectedTitle =
        methodMessages.seo?.title ?? defaultMethodMessages.seo?.title ?? DEFAULT_METHOD_TITLE;
      await expect(page).toHaveTitle(expectedTitle);

      const metaDescriptions = await page
        .locator('meta[name="description"]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('content') ?? ''));

      const expectedDescription = methodMessages.seo?.description ?? defaultMethodMessages.seo?.description;

      if (expectedDescription) {
        expect(metaDescriptions).toContain(expectedDescription);
      } else {
        expect(metaDescriptions.some((content) => content.trim().length > 0)).toBeTruthy();
      }

      const robots = page.locator('meta[name="robots"]');
      if (PRELAUNCH_FLAG) {
        await expect(robots).toHaveAttribute('content', /noindex/i);
      } else {
        await expect(robots).toHaveCount(0);
      }

      const canonical = page.locator('link[rel="canonical"]').first();
      const canonicalHref = await canonical.getAttribute('href');
      const expectedCanonical = makeCanonical(targetPath);
      expect(canonicalHref).toBe(expectedCanonical);

      const alternateEntries = await page
        .locator('link[rel="alternate"]')
        .evaluateAll((nodes) =>
          nodes.map((node) => ({
            hreflang: node.getAttribute('hreflang'),
            href: node.getAttribute('href'),
          })),
        );
      const hreflangMap = new Map<string, string>();
      for (const entry of alternateEntries) {
        if (entry.hreflang && entry.href) {
          hreflangMap.set(entry.hreflang, entry.href);
        }
      }

      const expectedAlternates = hreflangMapFor(methodPath);

      for (const [hreflang, href] of Object.entries(expectedAlternates)) {
        expect(hreflangMap.get(hreflang)).toBe(href);
      }

      expect(hreflangMap.get('x-default')).toBe(expectedAlternates['x-default']);

      const jsonLdSnippets = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ''));
      expect(jsonLdSnippets.some((content) => content.includes('"@type":"BreadcrumbList"'))).toBeTruthy();
    });
  }

  test('sitemap index and locale files expose canonical URLs', async ({ page }) => {
    const indexResponse = await page.request.get('/sitemap.xml');
    expect(indexResponse.status()).toBe(200);
    const indexBody = await indexResponse.text();

    for (const locale of localesToTest) {
      const slug = sitemapSlugForLocale(locale);
      const sitemapUrl = makeCanonical(`/sitemaps/${slug}.xml`);
      expect(indexBody).toContain(`<loc>${sitemapUrl}</loc>`);

      const localeResponse = await page.request.get(`/sitemaps/${slug}.xml`);
      expect(localeResponse.status()).toBe(200);
      const localeBody = await localeResponse.text();
      const expectedMethod = makeCanonical(methodPath(locale));
      expect(localeBody).toContain(`<loc>${expectedMethod}</loc>`);
    }
  });
});
