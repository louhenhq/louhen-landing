import { test, expect } from '@tests/fixtures/playwright';

test.describe('Header shell structure', () => {
  test('desktop header renders primary navigation and hides drawer trigger', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
    await expect(page).toHaveURL(/\/de-de\/?$/);

    const banner = page.getByTestId('lh-nav-root');
    await expect(banner).toBeVisible();

    const skipLink = page.getByTestId('lh-nav-skip-link');
    await expect(skipLink).toHaveText('Skip to main content');

    await expect(page.getByTestId('lh-nav-item-how-it-works')).toBeVisible();
    await expect(page.getByTestId('lh-nav-item-founder-story')).toBeVisible();

    const drawerTrigger = page.getByTestId('lh-nav-menu-toggle');
    await expect(drawerTrigger).toBeHidden();

    await expect(page.getByTestId('lh-nav-consent-button-desktop')).toHaveAttribute('data-consent-state', 'unset');

  });

  test('mobile drawer trigger toggles menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
    await expect(page).toHaveURL(/\/de-de\/?$/);

    const trigger = page.getByTestId('lh-nav-menu-toggle');
    await expect(trigger).toBeVisible();

    await trigger.click();
    const drawer = page.locator('[data-nav-drawer]');
    await expect(drawer).toBeVisible();

    await page.locator('[data-nav-drawer-close]').click();
    await expect(drawer).toHaveCount(0);
  });
});
