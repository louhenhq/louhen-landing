import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { locales } from '@/next-intl.locales';
import { legalPath } from '@/lib/routing/legalPath';

const SLUGS = ['terms', 'privacy'] as const;

type AxeResults = Awaited<ReturnType<InstanceType<typeof AxeBuilder>['analyze']>>;

function getSeriousOrCriticalViolations(violations: AxeResults['violations']) {
  return violations.filter((violation) => {
    const impact = violation.impact ?? 'minor';
    return impact === 'serious' || impact === 'critical';
  });
}

test.describe('Legal pages accessibility', () => {
  for (const locale of locales) {
    for (const slug of SLUGS) {
      const path = legalPath(locale, slug);

      test(`${locale} ${path} has no serious accessibility violations`, async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' });

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
