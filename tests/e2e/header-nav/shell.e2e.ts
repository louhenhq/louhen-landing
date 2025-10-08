import { test, expect } from '@playwright/test';
import { localeUrl } from '../_utils/url';

test.describe('Header shell structure', () => {
  test('desktop header renders primary navigation and hides drawer trigger', async ({ page }) => {
    await page.goto(localeUrl(), { waitUntil: 'networkidle' });

    const banner = page.locator('[data-ll="nav-root"]');
    await expect(banner).toBeVisible();

    const skipLink = page.getByTestId('header-skip-link');
    await expect(skipLink).toHaveText('Skip to main content');

    await expect(page.locator('[data-nav-id="how-it-works"]').first()).toBeVisible();
    await expect(page.locator('[data-nav-id="founder-story"]').first()).toBeVisible();

    const drawerTrigger = page.locator('[data-ll="nav-menu-button"]');
    await expect(drawerTrigger).toBeHidden();

    await expect(page.getByTestId('header-consent-button-desktop')).toHaveAttribute('data-consent-state', 'unset');

  });

  test('mobile drawer trigger toggles menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(localeUrl(), { waitUntil: 'networkidle' });

    const trigger = page.locator('[data-ll="nav-menu-button"]');
    await expect(trigger).toBeVisible();

    await trigger.click();
    const drawer = page.locator('[data-nav-drawer]');
    await expect(drawer).toBeVisible();

    await page.locator('[data-nav-drawer-close]').click();
    await expect(drawer).toHaveCount(0);
  });
});
