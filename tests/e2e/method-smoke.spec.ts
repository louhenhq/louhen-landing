import { expect, test } from '@playwright/test';
import { locales, type SupportedLocale } from '@/next-intl.locales';
import { loadMessages } from '@/lib/intl/loadMessages';
import { methodPath } from '@/lib/routing/methodPath';

type MethodMessages = {
  seo: { title: string };
  hero: { title: string };
  pillars: { title: string };
  how: { title: string };
  trust: { headline: string };
  cta: { button: string };
};

test.describe('Method page smoke test', () => {
  for (const locale of locales) {
    test(`${locale} renders localized hero and key content`, async ({ page }) => {
      const messages = (await loadMessages(locale)) as { method?: Partial<MethodMessages> };
      const methodMessages = messages.method ?? {};

      const response = await page.goto(methodPath(locale), { waitUntil: 'networkidle' });
      expect(response?.status()).toBe(200);

      if (methodMessages.seo?.title) {
        await expect(page).toHaveTitle(methodMessages.seo.title);
      }

      const heroHeading = page.getByRole('heading', { level: 1 }).first();
      await expect(heroHeading).toBeVisible();
      if (methodMessages.hero?.title) {
        await expect(heroHeading).toHaveText(methodMessages.hero.title);
      }

      if (methodMessages.pillars?.title) {
        await expect(page.getByRole('heading', { level: 2, name: methodMessages.pillars.title })).toBeVisible();
      }

      if (methodMessages.how?.title) {
        await expect(page.getByRole('heading', { level: 2, name: methodMessages.how.title })).toBeVisible();
      }

      if (methodMessages.trust?.headline) {
        await expect(page.getByRole('heading', { level: 2, name: methodMessages.trust.headline })).toBeVisible();
      }

      if (methodMessages.cta?.button) {
        await expect(page.getByRole('link', { name: methodMessages.cta.button })).toBeVisible();
      }
    });
  }
});
