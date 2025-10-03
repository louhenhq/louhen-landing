import { createRequire } from 'node:module';
import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { DEFAULT_LOCALE } from '@/lib/i18n/locales';

const require = createRequire(import.meta.url);

const localePrefix = `/${DEFAULT_LOCALE.value}`;

const routes = [
  `${localePrefix}/waitlist`,
  `${localePrefix}/waitlist/confirm?token=sample-token`,
  `${localePrefix}/waitlist/success`,
  `${localePrefix}/waitlist/expired`,
  `${localePrefix}/waitlist/already-confirmed`,
  `${localePrefix}/waitlist/pre-onboarding`,
];

test.describe('Waitlist accessibility', () => {
  for (const path of routes) {
    test(`has no axe violations on ${path} @axe`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });

      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const results = await page.evaluate(async () => {
        return await (window as typeof window & { axe: typeof axe }).axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa'],
          },
        });
      });

      expect(results.violations).toEqual([]);
    });
  }
});
