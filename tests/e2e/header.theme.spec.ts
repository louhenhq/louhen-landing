import { expect, test } from '@playwright/test';

test.describe('Header theme toggle', () => {
  test('desktop theme selection persists across reloads', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/en?utm_source=theme-desktop', { waitUntil: 'networkidle' });

    const themeSelect = page.getByTestId('header-theme-select-desktop');
    await expect(themeSelect).toBeVisible();

    await themeSelect.selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(themeSelect).toHaveValue('dark');

    await themeSelect.selectOption('system');
    await expect(themeSelect).toHaveValue('system');

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(100);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(100);
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');

    await page.emulateMedia({ colorScheme: null });
  });

  test('mobile theme change closes drawer and updates attribute', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/de?utm_source=theme-mobile', { waitUntil: 'networkidle' });

    const trigger = page.locator('[data-nav-drawer-trigger]');
    await trigger.click();

    const drawer = page.locator('[data-nav-drawer]');
    await expect(drawer).toBeVisible();

    const themeSelect = page.getByTestId('header-theme-select-mobile');
    await expect(themeSelect).toBeVisible();

    await themeSelect.selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(drawer).toHaveCount(0);
  });
});
