import { expect, test } from '@playwright/test';
import { defaultLocale, type SupportedLocale } from '@/next-intl.locales';
import enMessages from '@/messages/en.json' assert { type: 'json' };

function methodPath(locale: SupportedLocale): string {
  return locale === defaultLocale ? '/method' : `/${locale}/method`;
}

test.describe('Method page smoke test', () => {
  const locale: SupportedLocale = 'en';
  const messages = enMessages.method;

  test('renders localized hero and key content', async ({ page }) => {
    const response = await page.goto(methodPath(locale), { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(messages.seo.title);

    const heroHeading = page.getByRole('heading', { level: 1 }).first();
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toHaveText(messages.hero.title);

    await expect(page.getByRole('heading', { level: 2, name: messages.pillars.title })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: messages.how.title })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: messages.trust.headline })).toBeVisible();
    await expect(page.getByRole('link', { name: messages.cta.button })).toBeVisible();
  });
});
