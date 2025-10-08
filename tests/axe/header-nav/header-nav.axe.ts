import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { localeUrl } from '../../e2e/_utils/url';

const SERIOUS_IMPACT = new Set(['serious', 'critical']);

test.describe('Header nav accessibility', () => {
  test('default locale header passes axe checks', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(localeUrl(), { waitUntil: 'networkidle' });

    const report = await new AxeBuilder({ page })
      .include('[data-ll="nav-root"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const violations = report.violations.filter((violation) => SERIOUS_IMPACT.has(violation.impact ?? 'minor'));
    expect(violations).toEqual([]);
  });

  test('localized header remains accessible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(localeUrl('/de-de/method?utm_source=axe-header'), { waitUntil: 'networkidle' });

    const report = await new AxeBuilder({ page })
      .include('[data-ll="nav-root"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const violations = report.violations.filter((violation) => SERIOUS_IMPACT.has(violation.impact ?? 'minor'));
    expect(violations).toEqual([]);
  });
});
