import { test, expect } from '@tests/fixtures/playwright';
import AxeBuilder from '@axe-core/playwright';
import { buildHeaderNavigation } from '@lib/nav/config';
import type { SupportedLocale } from '@/next-intl.locales';
import { getTestLocales, localeUrl } from '../_utils/url';

const SERIOUS_IMPACT = new Set(['serious', 'critical']);

const localesToTest = getTestLocales();

test.describe('Header information architecture', () => {
  for (const locale of localesToTest) {
    const path = getHomePath(locale as SupportedLocale);

    test(`${locale} primary nav links are localized and accessible`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });

      const navigation = buildHeaderNavigation(locale as SupportedLocale);

      for (const item of navigation.primary) {
        const link = page.locator(`[data-nav-id="${item.id}"]`).first();
        await expect(link, `Expected nav item ${item.id} to be visible for ${locale}`).toBeVisible();
        const href = await link.getAttribute('href');
        expect(href).toBe(item.href);
        const analytics = await link.getAttribute('data-analytics-event');
        expect(analytics).toBe(item.analyticsEvent ?? null);
      }

      const results = await new AxeBuilder({ page })
        .include('header')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const violations = results.violations.filter((violation) => {
        const impact = violation.impact ?? 'minor';
        return SERIOUS_IMPACT.has(impact);
      });
      expect(violations, `Accessibility violations detected on ${locale} header`).toEqual([]);
    });
  }
});

function getHomePath(locale: SupportedLocale): string {
  return localeUrl(undefined, { locale });
}
