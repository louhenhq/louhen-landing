import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { getTestLocales, localeUrl } from '@tests/e2e/_utils/url';

const locales = getTestLocales();

type AxeResults = Awaited<ReturnType<InstanceType<typeof AxeBuilder>['analyze']>>;

function getSeriousViolations(violations: AxeResults['violations']) {
  return violations.filter((violation) => {
    const impact = violation.impact ?? 'minor';
    return impact === 'serious' || impact === 'critical';
  });
}

test.describe('Waitlist form accessibility', () => {
  for (const locale of locales) {
    test(`${locale} waitlist page has no serious Axe violations`, async ({ page }) => {
      await page.goto(localeUrl('/waitlist', { locale }), { waitUntil: 'networkidle' });

      const form = page.locator('[data-ll="wl-form"]').first();
      await expect(form).toBeVisible();

      const results = await new AxeBuilder({ page })
        .include('[data-ll="wl-form"]')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const serious = getSeriousViolations(results.violations);
      expect(serious, `Accessibility issues detected for ${locale} waitlist form`).toEqual([]);
    });
  }
});
