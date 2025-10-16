import { expect, test } from '@tests/fixtures/playwright';
import { runAxe } from '@tests/fixtures/axe';
import { getDefaultLocale, setLocaleCookie } from '@tests/e2e/_utils/url';

const locale = getDefaultLocale();

test.describe('Header navigation — accessibility', () => {
  test.beforeEach(async ({ context }) => {
    await setLocaleCookie(context, locale);
  });

  test('desktop landmarks and axe', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
    await expect(page).toHaveURL(/\/de-de\/?$/);

    const banner = page.getByTestId('lh-nav-root');
    await expect(banner).toHaveAttribute('role', 'banner');

    const primaryNav = banner.locator('nav').first();
    await expect(primaryNav).toHaveAttribute('role', 'navigation');
    await expect(primaryNav).toHaveAttribute('aria-label', /primary/i);

    const menuTrigger = page.getByTestId('lh-nav-menu-toggle');
    await expect(menuTrigger).toBeHidden();

    await runAxe(page, testInfo, { route: 'header-nav-desktop', locale, viewport: 'desktop' });
  });

  test('@mobile drawer semantics and axe', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
    await expect(page).toHaveURL(/\/de-de\/?$/);

    const menuTrigger = page.getByTestId('lh-nav-menu-toggle');
    await expect(menuTrigger).toBeVisible();
    await expect(menuTrigger).toHaveAttribute('aria-controls', 'header-mobile-drawer');
    await expect(menuTrigger).toHaveAttribute('aria-haspopup', 'dialog');

    await menuTrigger.click();

    const drawer = page.locator('[data-nav-drawer]');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expect(menuTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('lh-nav-drawer-heading')).toBeFocused();

    await runAxe(page, testInfo, { route: 'header-nav-drawer', locale, viewport: 'mobile' });
  });
});
