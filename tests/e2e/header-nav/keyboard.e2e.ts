import { expect, test } from '@tests/fixtures/playwright';
import type { Page } from '@playwright/test';

async function focusMenuTrigger(page: Page): Promise<void> {
  const trigger = page.getByTestId('lh-nav-menu-toggle');
  for (let i = 0; i < 10; i += 1) {
    const focused = await trigger.evaluate((el) => el === document.activeElement);
    if (focused) return;
    await page.keyboard.press('Tab');
  }
  await expect(trigger).toBeFocused();
}

async function activeElementInsideDrawer(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const drawer = document.querySelector('[data-nav-drawer]');
    const active = document.activeElement;
    return Boolean(drawer && active instanceof HTMLElement && drawer.contains(active));
  });
}

test.describe('@mobile keyboard navigation — header drawer', () => {
  test('opens, traps focus, and restores trigger focus', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
    await expect(page).toHaveURL(/\/de-de\/?$/);

    const trigger = page.getByTestId('lh-nav-menu-toggle');
    await focusMenuTrigger(page);
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('lh-nav-drawer-heading')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect.poll(() => activeElementInsideDrawer(page)).toBe(true);
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByTestId('lh-nav-drawer-heading')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Space');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('lh-nav-drawer-heading')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });
});
