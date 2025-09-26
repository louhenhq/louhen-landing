import { expect, test } from '@playwright/test';

test.describe('/en/method page smoke test', () => {
  test('renders localized hero and key content', async ({ page }) => {
    await page.goto('/en/method');
    const title = await page.title();
    expect(title).toMatch(/Method/i);
    expect(title).toMatch(/Louhen/i);
    const heroHeading = page.getByRole('heading', { level: 1 }).first();
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText(/Our Method/i);

    await expect(page.getByRole('heading', { level: 2, name: /Capturing precise shoe dimensions/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Trust pillars/i })).toBeVisible();
    await expect(page.getByText(/computer vision with human insight/i)).toBeVisible();
  });
});
