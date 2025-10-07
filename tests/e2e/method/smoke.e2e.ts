import { expect, test } from '@playwright/test';
import type { SupportedLocale } from '@/next-intl.locales';
import { loadMessages } from '@lib/intl/loadMessages';
import { methodPath } from '@lib/shared/routing/method-path';
import { getTestLocales } from '../_utils/url';

type MethodMessages = {
  seo: { title: string };
  hero: { title: string };
  pillars: { title: string };
  how: { title: string };
  trust: { headline: string };
  cta: { button: string };
};

const localesToTest = getTestLocales();

test.describe('Method page smoke test', () => {
  for (const locale of localesToTest as SupportedLocale[]) {
    test(`${locale} renders localized hero and key content`, async ({ page }) => {
      const messages = (await loadMessages(locale)) as { method?: Partial<MethodMessages> };
      const methodMessages = messages.method ?? {};

      const response = await page.goto(methodPath(locale), { waitUntil: 'networkidle' });
      expect(response?.status()).toBe(200);

      if (methodMessages.seo?.title) {
        await expect(page).toHaveTitle(methodMessages.seo.title);
      }

      const hero = page.locator('[data-ll="method-hero"]');
      await expect(hero).toBeVisible();
      const heroHeading = hero.getByRole('heading', { level: 1 }).first();
      if (methodMessages.hero?.title) {
        await expect(heroHeading).toHaveText(methodMessages.hero.title);
      }

      const pillars = page.locator('[data-ll="method-pillars"]');
      await expect(pillars).toBeVisible();
      if (methodMessages.pillars?.title) {
        await expect(pillars.getByRole('heading', { level: 2 })).toHaveText(methodMessages.pillars.title);
      }

      const how = page.locator('[data-ll="method-how"]');
      await expect(how).toBeVisible();
      if (methodMessages.how?.title) {
        await expect(how.getByRole('heading', { level: 2 })).toHaveText(methodMessages.how.title);
      }

      const trust = page.locator('[data-ll="method-trust"]');
      await expect(trust).toBeVisible();
      if (methodMessages.trust?.headline) {
        await expect(trust.getByRole('heading', { level: 2 })).toHaveText(methodMessages.trust.headline);
      }

      const cta = page.locator('[data-ll="method-hero-cta"]');
      if (methodMessages.cta?.button) {
        await expect(cta).toBeVisible();
        await expect(cta).toHaveText(methodMessages.cta.button);
      }
    });
  }
});
