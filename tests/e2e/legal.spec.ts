import { expect, test } from '@playwright/test';
import { defaultLocale, locales } from '@/next-intl.locales';
import { legalPath, localeHomePath, type LegalSlug } from '@/lib/routing/legalPath';

const TERMS_PATTERNS = [/terms/i, /allgemeine\s+geschäftsbedingungen/iu];
const PRIVACY_PATTERNS = [/privacy/i, /datenschutz/i];

const PRELAUNCH_FLAG =
  (process.env.IS_PRELAUNCH?.trim() === 'true' || process.env.IS_PRELAUNCH?.trim() === '1') ||
  (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production');

const rawBaseUrl = process.env.APP_BASE_URL ?? 'http://localhost:4311';
const fallbackBaseUrl = 'https://louhen-landing.vercel.app';
const allowedHosts = [
  (() => {
    try {
      return new URL(rawBaseUrl.replace(/\/$/, '')).host;
    } catch {
      return null;
    }
  })(),
  (() => {
    try {
      return new URL(fallbackBaseUrl).host;
    } catch {
      return null;
    }
  })(),
].filter(Boolean) as string[];

const SPECIAL_REGEX_CHARS = new Set(['\\', '^', '$', '.', '|', '?', '*', '+', '(', ')', '[', ']', '{', '}']);

function escapeForRegex(value: string): string {
  return value
    .split('')
    .map((char) => (SPECIAL_REGEX_CHARS.has(char) ? `\\${char}` : char))
    .join('');
}

function legalUrlMatcher(locale: string, slug: LegalSlug): RegExp {
  const expectedPath = legalPath(locale, slug);
  return new RegExp(`${escapeForRegex(expectedPath)}(?:/)?(?:[?#].*)?$`);
}

function getCanonicalParts(href: string | null) {
  if (!href) {
    return { host: null, path: null };
  }

  try {
    const url = new URL(href);
    return {
      host: url.host,
      path: url.pathname.replace(/\/$/, '') || '/',
    };
  } catch {
    return { host: null, path: href.replace(/\/$/, '') };
  }
}

function matchesAny(text: string | null, patterns: RegExp[]): boolean {
  if (!text) return false;
  return patterns.some((pattern) => pattern.test(text));
}

test.describe('Localized legal pages', () => {
  for (const locale of locales) {
    test.describe(`${locale}`, () => {
      const routes = [
        { slug: 'terms', patterns: TERMS_PATTERNS },
        { slug: 'privacy', patterns: PRIVACY_PATTERNS },
      ] as const;

      for (const { slug, patterns } of routes) {
        const path = legalPath(locale, slug);

        test(`${path} renders localized content`, async ({ page }) => {
          const response = await page.goto(path, { waitUntil: 'networkidle' });
          expect(response?.status()).toBe(200);

          const h1 = page.locator('h1').first();
          await expect(h1).toHaveCount(1);
          const h1Text = await h1.textContent();
          expect(matchesAny(h1Text, patterns)).toBeTruthy();

          await expect(page.getByTestId('last-updated')).toBeVisible();

          if (PRELAUNCH_FLAG) {
            const robots = page.locator('meta[name="robots"]');
            await expect(robots).toHaveAttribute('content', /noindex/i);
          }

          const canonical = page.locator('link[rel="canonical"]').first();
          const canonicalHref = await canonical.getAttribute('href');
          expect(canonicalHref).not.toBeNull();
          const canonicalParts = getCanonicalParts(canonicalHref);
          expect(canonicalParts.path).toBe(legalPath(locale, slug));
          if (canonicalParts.host) {
            expect(allowedHosts).toContain(canonicalParts.host);
          }

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

          const localeHref = hreflangMap.get(locale);
          expect(localeHref).toBeTruthy();
          const localeParts = getCanonicalParts(localeHref ?? null);
          expect(localeParts.path).toBe(legalPath(locale, slug));
          if (localeParts.host) {
            expect(allowedHosts).toContain(localeParts.host);
          }

          if (locale === defaultLocale) {
            const defaultHref = hreflangMap.get('x-default');
            expect(defaultHref).toBeTruthy();
            const defaultParts = getCanonicalParts(defaultHref ?? null);
            expect(defaultParts.path).toBe(legalPath(defaultLocale, slug));
            if (defaultParts.host) {
              expect(allowedHosts).toContain(defaultParts.host);
            }
          }
        });
      }
    });
  }

  test('footer legal links route per locale', async ({ browser }) => {
    for (const locale of locales) {
      const context = await browser.newContext();
      const page = await context.newPage();

      const homePath = localeHomePath(locale);
      await page.goto(homePath, { waitUntil: 'networkidle' });

      const footer = page.locator('footer');
      await expect(footer).toBeVisible();

      const termsLink = footer.getByRole('link', { name: /terms|allgemeine/i });
      const privacyLink = footer.getByRole('link', { name: /privacy|datenschutz/i });

      await expect(termsLink).toBeVisible();
      await termsLink.click();
      await expect(page).toHaveURL(legalUrlMatcher(locale, 'terms'));
      await expect(page.locator('h1')).toHaveCount(1);

      await page.goBack();

      await expect(privacyLink).toBeVisible();
      await privacyLink.click();
      await expect(page).toHaveURL(legalUrlMatcher(locale, 'privacy'));
      await expect(page.locator('h1')).toHaveCount(1);

      await context.close();
    }
  });
});
