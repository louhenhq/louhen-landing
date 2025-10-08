import { createRequire } from 'node:module';
import { test, expect } from '@playwright/test';
import axe from 'axe-core';

const require = createRequire(import.meta.url);

const routes = [
  '/waitlist',
  '/waitlist/confirm?token=sample-token',
  '/waitlist/success',
  '/waitlist/expired',
  '/waitlist/already-confirmed',
  '/waitlist/pre-onboarding',
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
