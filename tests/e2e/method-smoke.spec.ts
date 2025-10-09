import { expect, test } from '@playwright/test';

test.describe('/en-de/method page smoke test', () => {
  test('renders localized hero, skip link, and CTA target', async ({ page }) => {
    await page.goto('/en-de/method/');
    const title = await page.title();
    expect(title).toMatch(/Method/i);
    expect(title).toMatch(/Louhen/i);
<<<<<<< HEAD
    const skipLink = page.getByRole('link', { name: /Skip to Join Waitlist/i });
    await expect(skipLink).toBeVisible();
    const heroHeading = page.getByRole('heading', { level: 1, name: /Fit intelligence/i });
    await expect(heroHeading).toBeVisible();
    await expect(page.locator('#join-waitlist')).toBeVisible();
  });

  test('FAQ teaser links resolve to localized waitlist sections', async ({ page }) => {
    const faqLinks = [
      /How does onboarding work\?/i,
      /What is the LouhenFit guarantee\?/i,
      /How do you protect data\?/i,
    ];

    for (const linkName of faqLinks) {
      await page.goto('/en-de/method/');
      await Promise.all([
        page.waitForURL(/\/en-de\/waitlist(\?|#|$)/),
        page.getByRole('link', { name: linkName }).click(),
      ]);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.goBack();
      await page.waitForURL(/\/en-de\/method\/?$/);
    }
  });

  test('Science disclosure privacy link is locale aware', async ({ page }) => {
    await page.goto('/en-de/method/');
    const disclosureButton = page.getByRole('button', { name: /See the science/i });
    await disclosureButton.click();
    await expect(page.getByRole('region', { name: /See the science/i })).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/en-de\/privacy\/?$/),
      page.getByRole('link', { name: /privacy policy/i }).click(),
    ]);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
=======
    const heroHeading = page.getByRole('heading', { level: 1 }).first();
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText(/Our Method/i);

    await expect(page.getByRole('heading', { level: 2, name: /Capturing precise shoe dimensions/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Trust pillars/i })).toBeVisible();
    await expect(page.getByText(/computer vision with human insight/i)).toBeVisible();
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  });
});
