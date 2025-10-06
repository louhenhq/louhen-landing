import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Header shell structure', () => {
  test('desktop header renders primary navigation and hides drawer trigger', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const banner = page.getByRole('banner');
    await expect(banner).toBeVisible();

    const skipLink = page.getByTestId('header-skip-link');
    await expect(skipLink).toHaveText('Skip to main content');

    await expect(page.locator('[data-nav-id="how-it-works"]').first()).toBeVisible();
    await expect(page.locator('[data-nav-id="founder-story"]').first()).toBeVisible();

    const drawerTrigger = page.locator('[data-nav-drawer-trigger]');
    await expect(drawerTrigger).toBeHidden();

    await expect(page.getByTestId('header-consent-button-desktop')).toHaveAttribute('data-consent-state', 'unset');

    const axe = await new AxeBuilder({ page })
      .include('header')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const serious = axe.violations.filter((violation) => (violation.impact ?? 'minor') !== 'minor' && violation.impact !== 'moderate');
    expect(serious).toEqual([]);
  });

  test('mobile drawer trigger toggles menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const trigger = page.locator('[data-nav-drawer-trigger]');
    await expect(trigger).toBeVisible();

    await trigger.click();
    const drawer = page.locator('[data-nav-drawer]');
    await expect(drawer).toBeVisible();

    await page.locator('[data-nav-drawer-close]').click();
    await expect(drawer).toHaveCount(0);
  });
});
