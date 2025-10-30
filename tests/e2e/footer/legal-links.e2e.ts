import { expect, test } from '@tests/fixtures/playwright';
import { defaultLocale } from '@/next-intl.locales';
import { legalPath, type LegalSlug } from '@lib/shared/routing/legal-path';
import { getTestLocales, localeUrl, setLocaleCookie } from '../_utils/url';

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

const KEY_PAGES = [
  { name: 'home', path: '/' },
  { name: 'waitlist', path: '/waitlist' },
  { name: 'method', path: '/method' },
] as const;

test.describe('Footer legal links', () => {
  for (const locale of localesToTest) {
    test.describe(`${locale}`, () => {
      for (const keyPage of KEY_PAGES) {
        test(`${keyPage.name} renders footer`, async ({ page, context }) => {
          await setLocaleCookie(context, locale);
          const target =
            keyPage.path === '/'
              ? `/${locale}`
              : localeUrl(keyPage.path, { locale });
          await page.goto(target, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('networkidle');
          const expectedLocale = locale === defaultLocale ? defaultLocale : locale;
          const expectedPath =
            keyPage.path === '/'
              ? `/${expectedLocale}`
              : `/${expectedLocale}${keyPage.path}`;
          await expect(page).toHaveURL(new RegExp(`${escapeForRegex(expectedPath)}(?:/)?(?:[?#].*)?$`));

          const footer = page.locator('[data-ll="footer-root"]').first();
          await expect(footer, `Footer should be visible on ${keyPage.name} for ${locale}`).toBeVisible();
        });
      }

      test('legal links navigate to localized routes', async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        await setLocaleCookie(context, locale);
        const expectedLocale = locale === defaultLocale ? defaultLocale : locale;
        await page.goto(`/${expectedLocale}`, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(new RegExp(`/${expectedLocale}/?(?:[?#].*)?$`));

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
