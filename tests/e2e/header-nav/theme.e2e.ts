import { expect, test } from '@tests/fixtures/playwright';
import { localeUrl } from '../_utils/url';

test.describe('Header theme toggle', () => {
  test('desktop theme selection persists across reloads', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(localeUrl('?utm_source=theme-desktop'), { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');

    const themeSelect = page.getByTestId('lh-nav-theme-toggle-desktop-select');
    await expect(themeSelect).toBeVisible();

    await themeSelect.selectOption('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(themeSelect).toHaveValue('dark');

    await themeSelect.selectOption('system');
    await expect(themeSelect).toHaveValue('system');

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(async () => page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('dark');

    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(async () => page.evaluate(() => document.documentElement.getAttribute('data-theme'))).not.toBe('dark');

    await page.emulateMedia({ colorScheme: null });
  });

  test('mobile theme change closes drawer and updates attribute', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(localeUrl('?utm_source=theme-mobile', { locale: 'de-de' }), {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');

    const trigger = page.getByTestId('lh-nav-menu-toggle');
    await trigger.click();

    const drawer = page.locator('[data-nav-drawer]');
    await expect(drawer).toBeVisible();

    const themeSelect = page.getByTestId('lh-nav-theme-toggle-mobile-select');
    await expect(themeSelect).toBeVisible();

    await themeSelect.selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(drawer).toHaveCount(0);
  });
});
