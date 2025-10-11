import { createRequire } from 'node:module';
import { test, expect } from '@playwright/test';
import type axe from 'axe-core';
import { getDefaultLocale, setLocaleCookie } from '@tests/e2e/_utils/url';

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
      await setLocaleCookie(page.context(), getDefaultLocale());
      await page.goto(path, { waitUntil: 'domcontentloaded' });

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
