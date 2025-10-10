import { expect, test } from '@tests/fixtures/playwright';
import type { BrowserContext, Page } from '@playwright/test';
import { localeUrl, setLocaleCookie, getCookieDomain } from '../_utils/url';

const CONSENT_COOKIE_VALUE = () => encodeURIComponent('v1:granted');

const COOKIE_DOMAIN = getCookieDomain();

async function seedConsent(context: BrowserContext) {
  await context.addCookies([
    { name: 'll_consent', value: CONSENT_COOKIE_VALUE(), domain: COOKIE_DOMAIN, path: '/' },
  ]);
}

async function applyAuthHint(context: BrowserContext) {
  await context.addCookies([
    { name: 'LH_AUTH', value: '1', domain: COOKIE_DOMAIN, path: '/' },
  ]);
}

async function setThemePreference(context: BrowserContext, theme: 'light' | 'dark' | 'system') {
  if (theme === 'system') return;
  await context.addCookies([
    { name: 'lh_theme_pref', value: theme, domain: COOKIE_DOMAIN, path: '/' },
  ]);
}

async function gotoReady(page: Page, path: string) {
  await page.goto(localeUrl(path), { waitUntil: 'domcontentloaded' });
}

test.describe('Header regression pack', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await setLocaleCookie(context);
    await seedConsent(context);
    await setThemePreference(context, 'light');
  });

  test('CTA width stays stable between guest and hinted states', async ({ page, context }) => {
    await gotoReady(page, '?utm_source=header-width');
    const cta = page.locator('[data-ll="nav-waitlist-cta"]').first();
    await expect(cta).toBeVisible();

    const guestWidth = await cta.evaluate((node) => node.getBoundingClientRect().width);

    await applyAuthHint(context);
    await page.reload({ waitUntil: 'domcontentloaded' });

    const hintedCta = page.locator('[data-ll="nav-waitlist-cta"]').first();
    await expect(hintedCta).toHaveText('Dashboard');
    const hintedWidth = await hintedCta.evaluate((node) => node.getBoundingClientRect().width);

    expect(Math.abs(guestWidth - hintedWidth)).toBeLessThanOrEqual(4);

    const logoutLink = page.getByTestId('header-logout');
    await expect(logoutLink).toBeVisible();
    const logoutHeight = await logoutLink.evaluate((node) => node.getBoundingClientRect().height);
    expect(Math.round(logoutHeight)).toBeGreaterThanOrEqual(44);
  });

  test('Primary nav uses intent prefetch and exposes focus ring', async ({ page }) => {
    await gotoReady(page, '?utm_source=header-nav');

    const methodLink = page.locator('[data-nav-id="method"]');
    await expect(methodLink).toHaveAttribute('data-prefetch-policy', 'intent');

    const anchorLink = page.locator('[data-nav-id="how-it-works"]');
    await expect(anchorLink).not.toHaveAttribute('data-prefetch-policy', 'intent');

    await methodLink.focus();
    const outlineWidth = await methodLink.evaluate((node) => {
      const style = window.getComputedStyle(node as HTMLElement);
      return style.outlineStyle === 'none' || style.outlineWidth === '0px' ? 0 : parseFloat(style.outlineWidth || '0');
    });
    expect(outlineWidth).toBeGreaterThan(0);
  });

  test('Mobile drawer retains analytics surface metadata and focus', async ({ page, context }) => {
  await context.addCookies([
      { name: 'll_consent', value: CONSENT_COOKIE_VALUE(), domain: 'localhost', path: '/' },
    ]);
    await page.setViewportSize({ width: 414, height: 896 });
    await gotoReady(page, '?utm_source=header-drawer');

    const trigger = page.locator('[data-ll="nav-menu-button"]');
    await trigger.click();

    const drawerLink = page.locator('[data-nav-section="primary"] [data-nav-id="method"]').first();
    await expect(drawerLink).toHaveAttribute('data-surface', 'drawer');
    await expect(drawerLink).toBeVisible();

    await drawerLink.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const overflowState = await page.evaluate(() => window.getComputedStyle(document.body).overflow);
    expect(overflowState === '' || overflowState === 'visible').toBeTruthy();
  });
});
