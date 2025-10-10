import { expect, test } from '@tests/fixtures/playwright';
import { runAxe } from '@tests/fixtures/axe';
import { getDefaultLocale, localeUrl } from '@tests/e2e/_utils/url';

const locale = getDefaultLocale();

test.describe('Header navigation — accessibility', () => {
  test('desktop landmarks and axe', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(localeUrl('/', { locale }), { waitUntil: 'networkidle' });

    const banner = page.locator('[data-ll="nav-root"]');
    await expect(banner).toHaveAttribute('role', 'banner');

    const primaryNav = banner.locator('nav').first();
    await expect(primaryNav).toHaveAttribute('role', 'navigation');
    await expect(primaryNav).toHaveAttribute('aria-label', /primary/i);

    const menuTrigger = banner.locator('[data-ll="nav-menu-button"]');
    await expect(menuTrigger).toBeHidden();

    await runAxe(page, testInfo, { route: 'header-nav-desktop', locale, viewport: 'desktop' });
  });

  test('@mobile drawer semantics and axe', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(localeUrl('/', { locale }), { waitUntil: 'networkidle' });

    const menuTrigger = page.locator('[data-ll="nav-menu-button"]');
    await expect(menuTrigger).toBeVisible();
    await expect(menuTrigger).toHaveAttribute('aria-controls', 'header-mobile-drawer');
    await expect(menuTrigger).toHaveAttribute('aria-haspopup', 'dialog');

    await menuTrigger.click();

    const drawer = page.locator('[data-nav-drawer]');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expect(menuTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('header-drawer-heading')).toBeFocused();

    await runAxe(page, testInfo, { route: 'header-nav-drawer', locale, viewport: 'mobile' });
  });
});
