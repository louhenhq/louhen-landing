import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';
import axe from 'axe-core';
import { SUPPORTED_LOCALES } from '@/lib/i18n/locales';

const require = createRequire(import.meta.url);
const locales = SUPPORTED_LOCALES.map((entry) => entry.value);

const isSerious = (impact: string | undefined) => ['serious', 'critical'].includes((impact ?? '').toLowerCase());

test.describe('Method accessibility (axe)', () => {
  for (const locale of locales) {
    test(`has no serious/critical axe violations on /${locale}/method @axe`, async ({ page }) => {
      await page.goto(`/${locale}/method/`, { waitUntil: 'networkidle' });

      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });

      const results = await page.evaluate(async () => {
        return await (window as typeof window & { axe: typeof axe }).axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa'],
          },
        });
      });

      const impactfulViolations = results.violations.filter((violation) => isSerious(violation.impact));

      if (impactfulViolations.length > 0) {
        console.error(
          'Serious/Critical accessibility violations found:',
          impactfulViolations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            nodes: violation.nodes.length,
          }))
        );
      }

      expect(impactfulViolations, 'No serious/critical accessibility violations expected').toHaveLength(0);
    });
  }
});
