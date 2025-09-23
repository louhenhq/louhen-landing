import { expect, test } from '@playwright/test';

test.describe('/method page smoke test', () => {
  test('shows the Our Method heading', async ({ page }) => {
    await page.goto('/method');
    await expect(page.getByRole('heading', { level: 1, name: /Our Method/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Capturing precise shoe dimensions/i })).toBeVisible();
    await expect(page.getByText(/privacy first scanning/i)).toBeVisible();
  });
});
