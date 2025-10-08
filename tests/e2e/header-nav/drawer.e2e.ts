import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { localeUrl } from '../_utils/url';

async function activeElementInsideDrawer(page: Page) {
  return page.evaluate(() => {
    const drawer = document.querySelector('[data-nav-drawer]');
    const active = document.activeElement;
    return Boolean(drawer && active instanceof HTMLElement && drawer.contains(active));
  });
}

test.describe('Header mobile drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 896 });
    await page.goto(localeUrl('?utm_source=drawer-spec'), { waitUntil: 'networkidle' });
  });

  test('opens with dialog semantics, traps focus, and closes on Escape', async ({ page }) => {
    const trigger = page.locator('[data-ll="nav-menu-button"]');
    await trigger.click();

    const drawer = page.locator('[data-nav-drawer]');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('header-drawer-heading')).toBeFocused();

    // Tab/Shift+Tab remain within drawer
    await page.keyboard.press('Tab');
    await expect.poll(() => activeElementInsideDrawer(page)).toBe(true);
    await page.keyboard.press('Tab');
    await expect.poll(() => activeElementInsideDrawer(page)).toBe(true);
    await page.keyboard.press('Shift+Tab');
    await expect.poll(() => activeElementInsideDrawer(page)).toBe(true);

    // Escape closes and returns focus to trigger
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();

    await expect.poll(() =>
      page.evaluate(() => window.getComputedStyle(document.body).overflow)
    ).toBe('');
  });

  test('backdrop click closes and unlocks scroll', async ({ page }) => {
    const trigger = page.locator('[data-ll="nav-menu-button"]');
    await trigger.click();

    const backdrop = page.locator('[data-drawer-dismiss="backdrop"]');
    await backdrop.click({ position: { x: 10, y: 10 } });

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() =>
      page.evaluate(() => window.getComputedStyle(document.body).overflow)
    ).toBe('');
  });

  test('reduced motion renders without transitions', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });

    const trigger = page.locator('[data-ll="nav-menu-button"]');
    await trigger.click();

    const drawer = page.locator('[data-nav-drawer]');
    await expect(drawer).toHaveAttribute('data-motion', 'disabled');

    const overlay = page.locator('[data-drawer-backdrop]');
    await expect(overlay).toHaveAttribute('data-motion', 'disabled');

    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await page.emulateMedia({ reducedMotion: null });
  });
});
