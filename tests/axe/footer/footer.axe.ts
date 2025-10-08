import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { defaultLocale } from '@/next-intl.locales';
import { getTestLocales, localeUrl } from '@tests/e2e/_utils/url';

const localesToTest = getTestLocales();

function resolveHomeUrl(locale: string) {
  return locale === defaultLocale ? localeUrl() : localeUrl(undefined, { locale });
}

type AxeResults = Awaited<ReturnType<InstanceType<typeof AxeBuilder>['analyze']>>;

function getSeriousOrCritical(violations: AxeResults['violations']) {
  return violations.filter((violation) => {
    const impact = violation.impact ?? 'minor';
    return impact === 'serious' || impact === 'critical';
  });
}

test.describe('Footer accessibility', () => {
  for (const locale of localesToTest) {
    test(`${locale} footer landmark has no serious Axe violations`, async ({ page }) => {
      await page.goto(resolveHomeUrl(locale), { waitUntil: 'networkidle' });

      const footer = page.locator('[data-ll="footer-root"]').first();
      await expect(footer).toBeVisible();

      const results = await new AxeBuilder({ page })
        .include('[data-ll="footer-root"]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const seriousOrCritical = getSeriousOrCritical(results.violations);
      expect(seriousOrCritical, `Accessibility issues detected in footer for ${locale}`).toEqual([]);
    });
  }
});
