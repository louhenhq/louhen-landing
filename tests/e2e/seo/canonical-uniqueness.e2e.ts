import { expect, test } from '@playwright/test';
import type { SupportedLocale } from '@/next-intl.locales';
import { getTestLocales } from '../_utils/url';
import { hreflangMapFor, makeCanonical, resolveBaseUrl } from '@lib/seo/shared';
import { methodPath } from '@lib/shared/routing/method-path';
import {
  waitlistConfirmPath,
  waitlistConfirmPendingPath,
  waitlistLandingPath,
} from '@lib/shared/routing/waitlist-path';
import { imprintPath } from '@lib/shared/routing/imprint-path';

const testLocales = getTestLocales();
const baseUrl = resolveBaseUrl();

function normalizeCanonical(href: string | null) {
  if (!href) return null;
  const url = new URL(href);
  const normalizedPath = url.pathname.replace(/\/$/, '') || '/';
  return `${url.protocol}//${url.hostname.toLowerCase()}${normalizedPath}`;
}

type Target = {
  name: string;
  pathForLocale: (locale: SupportedLocale) => string;
  hreflangPathBuilder: (locale: SupportedLocale) => string;
};

const targets: Target[] = [
  {
    name: 'method',
    pathForLocale: (locale) => methodPath(locale),
    hreflangPathBuilder: (locale) => methodPath(locale),
  },
  {
    name: 'waitlist landing',
    pathForLocale: () => waitlistLandingPath(),
    hreflangPathBuilder: () => waitlistLandingPath(),
  },
  {
    name: 'waitlist confirm',
    pathForLocale: (locale) => waitlistConfirmPath(locale),
    hreflangPathBuilder: (locale) => waitlistConfirmPath(locale),
  },
  {
    name: 'waitlist confirm pending',
    pathForLocale: (locale) => waitlistConfirmPendingPath(locale),
    hreflangPathBuilder: (locale) => waitlistConfirmPendingPath(locale),
  },
  {
    name: 'imprint',
    pathForLocale: (locale) => imprintPath(locale),
    hreflangPathBuilder: (locale) => imprintPath(locale),
  },
];

test.describe('Canonical self-consistency', () => {
  for (const target of targets) {
    for (const locale of testLocales) {
      test(`${target.name} (${locale}) has exactly one canonical and full hreflang map`, async ({ page }) => {
        const path = target.pathForLocale(locale as SupportedLocale);
        await page.goto(path, { waitUntil: 'networkidle' });

        const canonicalLinks = page.locator('link[rel="canonical"]');
        await expect(canonicalLinks).toHaveCount(1);
        const canonicalHref = await canonicalLinks.first().getAttribute('href');
        const expectedCanonical = makeCanonical(path, baseUrl);
        expect(normalizeCanonical(canonicalHref)).toBe(normalizeCanonical(expectedCanonical));

        const alternateEntries = await page
          .locator('link[rel="alternate"]')
          .evaluateAll((nodes) =>
            nodes.map((node) => ({
              hreflang: node.getAttribute('hreflang'),
              href: node.getAttribute('href'),
            })),
          );
        const alternateMap = new Map<string, string>();
        for (const entry of alternateEntries) {
          if (entry.hreflang && entry.href) {
            alternateMap.set(entry.hreflang, entry.href);
          }
        }

        const expectedAlternates = hreflangMapFor((lang) => target.hreflangPathBuilder(lang), baseUrl);
        for (const [hreflang, href] of Object.entries(expectedAlternates)) {
          const received = alternateMap.get(hreflang);
          expect(received, `missing hreflang ${hreflang}`).toBe(href);
        }
      });
    }
  }
});

