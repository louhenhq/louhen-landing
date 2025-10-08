import { expect, test } from '@playwright/test';
import { localeUrl } from '../_utils/url';

test.describe('Header motion', () => {
  test('shrinks, hides on scroll down, and reveals on scroll up', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(localeUrl('?utm_source=motion-desktop'), { waitUntil: 'networkidle' });

    const header = page.locator('[data-ll="nav-root"]');
    await expect(header).toHaveAttribute('data-header-state', 'default');

    await page.evaluate(() => window.scrollTo(0, 70));
    await expect.poll(async () => header.getAttribute('data-header-state')).toBe('shrink');

    await page.evaluate(() => window.scrollTo(0, 160));
    await expect.poll(async () => header.getAttribute('data-header-state')).toBe('hidden');

    await page.evaluate(() => window.scrollTo(0, 40));
    await expect.poll(async () => header.getAttribute('data-header-state')).toBe('default');
  });

  test('focus within keeps header visible after hide', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(localeUrl('?utm_source=motion-focus'), { waitUntil: 'networkidle' });

    const header = page.locator('[data-ll="nav-root"]');

    await page.evaluate(() => window.scrollTo(0, 200));
    await expect.poll(async () => header.getAttribute('data-header-state')).toBe('hidden');

    const drawerTrigger = page.locator('[data-ll="nav-menu-button"]');
    await drawerTrigger.focus();
    await expect.poll(async () => header.getAttribute('data-header-state')).toBe('shrink');

    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);
    await page.evaluate(() => window.scrollTo(0, 220));
    await expect.poll(async () => header.getAttribute('data-header-state')).toBe('hidden');
  });

  test('reduced motion keeps header static', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(localeUrl('?utm_source=motion-reduced'), { waitUntil: 'networkidle' });

    const header = page.locator('[data-ll="nav-root"]');
    await expect(header).toHaveAttribute('data-motion', 'disabled');

    await page.evaluate(() => window.scrollTo(0, 250));
    await expect.poll(async () => header.getAttribute('data-header-state')).toBe('default');

    await page.emulateMedia({ reducedMotion: null });
  });
});
