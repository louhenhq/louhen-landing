import { expect, test } from '@playwright/test';

const LOCALE = process.env.E2E_DEFAULT_LOCALE ?? 'en-de';

test.describe('Method CTAs', () => {
  test('primary CTA visible; secondary conditional', async ({ page }) => {
    await page.goto(`/${LOCALE}/method/`, { waitUntil: 'networkidle' });

    const ctaSection = page.getByTestId('method-cta');
    const links = ctaSection.getByRole('link');

    const linkCount = await links.count();
    expect(linkCount, 'Method CTA should render at least one link').toBeGreaterThan(0);

    await expect(links.first()).toBeVisible();

    if (linkCount > 1) {
      await expect(links.nth(1)).toBeVisible();
    } else {
      expect(linkCount).toBe(1);
    }
  });
});
