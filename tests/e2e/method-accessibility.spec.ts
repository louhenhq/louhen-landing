import { expect, test } from '@playwright/test';

test.describe('/en/method accessibility flows', () => {
  test('keyboard navigation and dismissible elements behave accessibly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/en/method/');

    const skipLink = page.getByRole('link', { name: /Skip to Join Waitlist/i });
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#join-waitlist')).toBeFocused();

    const disclosureButton = page.getByRole('button', { name: /See the science/i });
    await disclosureButton.focus();
    await expect(disclosureButton).toHaveAttribute('aria-expanded', 'false');
    await disclosureButton.press('Enter');
    const disclosureRegion = page.getByRole('region', { name: /See the science/i });
    await expect(disclosureRegion).toBeFocused();
    await expect(disclosureButton).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(disclosureButton).toBeFocused();
    await expect(disclosureButton).toHaveAttribute('aria-expanded', 'false');

    const heroCta = page.getByRole('link', { name: /Join the waitlist/i }).first();
    await heroCta.focus();

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 0.4);
    });
    const stickyCta = page.getByTestId('method-sticky-cta').getByRole('link', { name: /Join the waitlist/i });
    await expect(stickyCta).toBeVisible();
    await stickyCta.focus();
    await expect(stickyCta).toBeFocused();

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    const nudge = page.getByTestId('method-exit-nudge');
    await expect(nudge).toBeVisible();
    const dismissButton = nudge.getByRole('button', { name: /dismiss/i });
    await dismissButton.focus();
    await page.keyboard.press('Escape');
    await expect(nudge).toHaveCount(0);
    await expect(heroCta).toBeFocused();

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await expect(page.getByTestId('method-exit-nudge')).toHaveCount(0);
  });
});
