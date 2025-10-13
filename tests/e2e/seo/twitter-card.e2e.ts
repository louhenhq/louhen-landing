import { expect, test } from '@tests/fixtures/playwright';
import { methodPath } from '@lib/shared/routing/method-path';
import { waitlistLandingPath } from '@lib/shared/routing/waitlist-path';
import { imprintPath } from '@lib/shared/routing/imprint-path';
import type { SupportedLocale } from '@/next-intl.locales';
import { getTestLocales } from '../_utils/url';

const testLocales = (() => {
  const locales = getTestLocales();
  if (locales.length <= 2) return locales as SupportedLocale[];
  return locales.slice(0, 2) as SupportedLocale[];
})();

test.describe('Twitter card metadata', () => {
  test('summary_large_image is consistent across key surfaces', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const { hostname } = new URL(page.url());

    await page.context().addCookies([
      {
        name: 'NEXT_LOCALE',
        value: testLocales[0] ?? 'de-de',
        domain: hostname,
        path: '/',
      },
    ]);

    const targets: Array<{ name: string; path: string; locale?: SupportedLocale }> = [{ name: 'home', path: '/' }];

    for (const locale of testLocales) {
      targets.push({ name: `waitlist (${locale})`, path: waitlistLandingPath(locale), locale });
      targets.push(
        { name: `method (${locale})`, path: methodPath(locale), locale },
        { name: `imprint (${locale})`, path: imprintPath(locale), locale },
      );
    }

    for (const target of targets) {
      if (target.locale) {
        await page.context().addCookies([
          {
            name: 'NEXT_LOCALE',
            value: target.locale,
            domain: hostname,
            path: '/',
          },
        ]);
      } else {
        await page.context().addCookies([
          {
            name: 'NEXT_LOCALE',
            value: testLocales[0] ?? 'de-de',
            domain: hostname,
            path: '/',
          },
        ]);
      }

      await page.goto(target.path, { waitUntil: 'domcontentloaded' });
      const twitterCard = await page.getAttribute('meta[name="twitter:card"]', 'content');
      expect(twitterCard, `${target.name} should define twitter:card`).toBe('summary_large_image');
    }
  });
});
