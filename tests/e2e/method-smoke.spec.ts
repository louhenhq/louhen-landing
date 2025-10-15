import { expect, test } from '@playwright/test';

test.describe('/en-de/method page smoke test', () => {
  test('renders localized hero, skip link, and CTA target', async ({ page }) => {
    await page.goto('/en-de/method/');
    const title = await page.title();
    expect(title).toMatch(/Method/i);
    expect(title).toMatch(/Louhen/i);
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
      page.waitForURL(/\/en-de\/legal\/privacy\/?$/),
      page.getByRole('link', { name: /privacy policy/i }).click(),
    ]);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('/de-de/method page smoke test', () => {
  test('renders localized hero, skip link, and CTA target', async ({ page }) => {
    await page.goto('/de-de/method/');
    const heroHeading = page.getByRole('heading', { level: 1 });
    await expect(heroHeading).toBeVisible();
    await expect(page.locator('#join-waitlist')).toBeVisible();
  });

  test('privacy and waitlist links stay within the default locale', async ({ page }) => {
    await page.goto('/de-de/method/');
    const waitlistLink = page.locator('a[href*="/waitlist"]').first();
    await Promise.all([
      page.waitForURL(/\/de-de\/waitlist(\?|#|$)/),
      waitlistLink.click(),
    ]);
    await page.goBack();
    await page.waitForURL(/\/de-de\/method\/?$/);

    const privacyLink = page.locator('a[href*="/legal/privacy"]').first();
    await Promise.all([
      page.waitForURL(/\/de-de\/legal\/privacy\/?$/),
      privacyLink.click(),
    ]);
  });
});
