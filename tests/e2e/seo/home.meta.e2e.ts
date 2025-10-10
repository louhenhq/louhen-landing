import { expect, test } from '@tests/fixtures/playwright';
import { getTestLocales, setLocaleCookie } from '../_utils/url';

const locales = getTestLocales();

test.describe('Home metadata', () => {
  for (const locale of locales) {
    test(`${locale} exposes description and JSON-LD`, async ({ page }) => {
      await setLocaleCookie(page.context(), locale);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`/${locale}/?(?:[?#].*)?$`));

      const metaDescriptions = await page
        .locator('meta[name="description"]')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('content') ?? ''));
      expect(metaDescriptions.some((content) => content.trim().length > 0)).toBeTruthy();

      const jsonLdSnippets = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ''));

      expect(jsonLdSnippets.some((content) => content.includes('"@type":"Organization"'))).toBeTruthy();
      expect(jsonLdSnippets.some((content) => content.includes('"@type":"WebSite"'))).toBeTruthy();
    });
  }
});
