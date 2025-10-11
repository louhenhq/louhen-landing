import { expect, test } from '@tests/fixtures/playwright';
import { localeUrl, setLocaleCookie, getCookieDomain } from '../_utils/url';

type Scenario = {
  name: string;
  path: string;
  viewport: { width: number; height: number };
  theme: 'system' | 'light' | 'dark';
  locale?: string;
  hinted: boolean;
  ribbon: boolean;
};

const shouldRunVisuals = process.env.HEADER_VISUAL === '1';
const COOKIE_DOMAIN = getCookieDomain();

const SCENARIOS: Scenario[] = [
  {
    name: 'desktop-light-guest',
    path: '?utm_source=header-visual-desktop',
    viewport: { width: 1280, height: 720 },
    theme: 'light',
    locale: 'de-de',
    hinted: false,
    ribbon: false,
  },
  {
    name: 'desktop-dark-hinted-ribbon',
    path: '?utm_source=header-visual-dark',
    viewport: { width: 1280, height: 720 },
    theme: 'dark',
    locale: 'de-de',
    hinted: true,
    ribbon: true,
  },
  {
    name: 'mobile-system-guest',
    path: '?utm_source=header-visual-mobile',
    viewport: { width: 414, height: 896 },
    theme: 'system',
    locale: 'de-de',
    hinted: false,
    ribbon: false,
  },
];

test.describe('Header visual snapshots', () => {
  test.skip(!shouldRunVisuals, 'Visual snapshots run when HEADER_VISUAL=1');

  for (const scenario of SCENARIOS) {
    test(`${scenario.name}`, async ({ page, context }) => {
      await context.clearCookies();
      await setLocaleCookie(context, scenario.locale);
      await context.addCookies([
        {
          name: 'll_consent',
          value: encodeURIComponent('v1:granted'),
          domain: COOKIE_DOMAIN,
          path: '/',
        },
      ]);

      if (scenario.theme !== 'system') {
        await context.addCookies([
          { name: 'lh_theme_pref', value: scenario.theme, domain: COOKIE_DOMAIN, path: '/' },
        ]);
      }

      if (scenario.hinted) {
        await context.addCookies([
          { name: 'LH_AUTH', value: '1', domain: COOKIE_DOMAIN, path: '/' },
        ]);
      }

      if (scenario.ribbon) {
        await page.addInitScript(() => {
          window.__LOUHEN_PROMO_RIBBON__ = {
            id: 'default',
          };
        });
      }

      await page.setViewportSize(scenario.viewport);
      await page.goto(localeUrl(scenario.path, { locale: scenario.locale }), { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');

      const header = page.getByTestId('lh-nav-root');
      await expect(header).toBeVisible();

      await expect(header).toHaveScreenshot(`${scenario.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
