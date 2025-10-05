import { expect, test } from '@playwright/test';
import { locales } from '@/next-intl.locales';
import { legalPath, localeHomePath, type LegalSlug } from '@/lib/routing/legalPath';

const TERMS_PATTERNS = [/terms/i, /allgemeine\s+geschäftsbedingungen/iu];
const PRIVACY_PATTERNS = [/privacy/i, /datenschutz/i];

const PRELAUNCH_FLAG =
  (process.env.IS_PRELAUNCH?.trim() === 'true' || process.env.IS_PRELAUNCH?.trim() === '1') ||
  (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production');

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
