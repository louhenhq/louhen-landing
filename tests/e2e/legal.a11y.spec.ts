import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { legalPath } from '@/lib/routing/legalPath';
import { getTestLocales, localeUrl } from './_utils/url';

const SLUGS = ['terms', 'privacy'] as const;

type AxeResults = Awaited<ReturnType<InstanceType<typeof AxeBuilder>['analyze']>>;

function getSeriousOrCriticalViolations(violations: AxeResults['violations']) {
  return violations.filter((violation) => {
    const impact = violation.impact ?? 'minor';
    return impact === 'serious' || impact === 'critical';
  });
}

const localesToTest = getTestLocales();

test.describe('Legal pages accessibility', () => {
  for (const locale of localesToTest) {
    for (const slug of SLUGS) {
      const path = legalPath(locale, slug);

      test(`${locale} ${path} has no serious accessibility violations`, async ({ page }) => {
        await page.goto(localeUrl(`/legal/${slug}`, { locale }), { waitUntil: 'networkidle' });

        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page.getByTestId('last-updated')).toBeVisible();

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();

        const seriousOrCritical = getSeriousOrCriticalViolations(results.violations);
        expect(seriousOrCritical, `Serious/critical accessibility issues detected on ${path}`).toEqual([]);
      });
    }
  }
});
