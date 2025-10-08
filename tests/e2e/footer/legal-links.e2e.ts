import { expect, test } from '@playwright/test';
import { defaultLocale } from '@/next-intl.locales';
import { legalPath, type LegalSlug } from '@lib/shared/routing/legal-path';
import { getTestLocales, localeUrl } from '../_utils/url';

const localesToTest = getTestLocales();

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

function resolveHomeUrl(locale: string) {
  return locale === defaultLocale ? localeUrl() : localeUrl(undefined, { locale });
}

const KEY_PAGES = [
  { name: 'home', resolveUrl: resolveHomeUrl },
  { name: 'waitlist', resolveUrl: (locale: string) => localeUrl('/waitlist', { locale }) },
  { name: 'method', resolveUrl: (locale: string) => localeUrl('/method', { locale }) },
] as const;

test.describe('Footer legal links', () => {
  for (const locale of localesToTest) {
    test.describe(`${locale}`, () => {
      for (const keyPage of KEY_PAGES) {
        test(`${keyPage.name} renders footer`, async ({ page }) => {
          await page.goto(keyPage.resolveUrl(locale), { waitUntil: 'networkidle' });

          const footer = page.locator('[data-ll="footer-root"]').first();
          await expect(footer, `Footer should be visible on ${keyPage.name} for ${locale}`).toBeVisible();
        });
      }

      test('legal links navigate to localized routes', async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto(resolveHomeUrl(locale), { waitUntil: 'networkidle' });

        const privacyLink = page.locator('[data-ll="footer-privacy-link"]').first();
        const termsLink = page.locator('[data-ll="footer-terms-link"]').first();

        await expect(privacyLink).toBeVisible();
        await privacyLink.click();
        await expect(page).toHaveURL(legalUrlMatcher(locale, 'privacy'));
        await expect(page.locator('h1')).toHaveCount(1);

        await page.goBack();

        await expect(termsLink).toBeVisible();
        await termsLink.click();
        await expect(page).toHaveURL(legalUrlMatcher(locale, 'terms'));
        await expect(page.locator('h1')).toHaveCount(1);

        await context.close();
      });
    });
  }
});
