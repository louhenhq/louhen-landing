import { expect, test } from '@playwright/test';
import { localeUrl } from './_utils/url';

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

const SCENARIOS: Scenario[] = [
  {
    name: 'desktop-light-guest',
    path: '?utm_source=header-visual-desktop',
    viewport: { width: 1280, height: 720 },
    theme: 'light',
    locale: 'en-de',
    hinted: false,
    ribbon: false,
  },
  {
    name: 'desktop-dark-hinted-ribbon',
    path: '?utm_source=header-visual-dark',
    viewport: { width: 1280, height: 720 },
    theme: 'dark',
    locale: 'en-de',
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
      await context.addCookies([
        {
          name: 'louhen_consent',
          value: encodeURIComponent(JSON.stringify({ analytics: true, marketing: false, timestamp: new Date().toISOString() })),
          domain: 'localhost',
          path: '/',
        },
      ]);

      if (scenario.theme !== 'system') {
        await context.addCookies([
          { name: 'lh_theme_pref', value: scenario.theme, domain: 'localhost', path: '/' },
        ]);
      }

      if (scenario.hinted) {
        await context.addCookies([
          { name: 'LH_AUTH', value: '1', domain: 'localhost', path: '/' },
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
      await page.goto(localeUrl(scenario.path, { locale: scenario.locale }), { waitUntil: 'networkidle' });

      const header = page.locator('header[role="banner"]');
      await header.waitFor({ state: 'visible' });

      await expect(header).toHaveScreenshot(`${scenario.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
