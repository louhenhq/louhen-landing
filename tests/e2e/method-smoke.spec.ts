import { expect, test } from '@playwright/test';

test.describe('/en/method page smoke test', () => {
  test('renders localized hero and key content', async ({ page }) => {
    await page.goto('/en/method');
    const title = await page.title();
    expect(title).toMatch(/Method/i);
    expect(title).toMatch(/Louhen/i);
    await expect(page.getByRole('heading', { level: 1, name: /Fit intelligence that keeps up with growing feet\./i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /What powers every Louhen recommendation/i })).toBeVisible();
    await expect(page.getByText(/Kid-safe scanning/i)).toBeVisible();
  });
});
