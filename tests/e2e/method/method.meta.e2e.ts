import { expect, test } from '@playwright/test';
import { loadMessages } from '@lib/intl/loadMessages';
import { methodPath } from '@lib/shared/routing/method-path';
import { hreflangMapFor, makeCanonical } from '@lib/seo/shared';
import { defaultLocale, type SupportedLocale } from '@/next-intl.locales';
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
      const response = await page.goto(targetPath, { waitUntil: 'networkidle' });
      const status = response?.status();
      if (status !== 200) {
        const snippet = response ? (await response.text()).slice(0, 400) : 'No response body';
        console.error(`[method.meta] ${targetPath} returned ${status}. Body preview: ${snippet}`);
      }
      expect(status).toBe(200);

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
    });
  }
});
