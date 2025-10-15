import { expect, test } from '@tests/fixtures/playwright';
import { runAxe } from '@tests/fixtures/axe';
import { testIds } from '@tests/e2e/_utils/selectors';
import { getDefaultLocale, getTestLocales, localeUrl, setLocaleCookie } from '@tests/e2e/_utils/url';
import type { Page } from '@playwright/test';

const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;

const defaultLocale = getDefaultLocale();
const allLocales = getTestLocales();
const secondaryLocale = allLocales.find((locale) => locale !== defaultLocale) ?? allLocales[0];
const locales = Array.from(new Set([defaultLocale, secondaryLocale]));

type RouteConfig = {
  name: string;
  path: string;
  ready: (page: Page) => Promise<void>;
};

const ROUTES: RouteConfig[] = [
  {
    name: 'home',
    path: '/',
    ready: async (page: Page) => {
      await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
      await expect(page.getByTestId('lh-nav-root')).toBeVisible();
    },
  },
  {
    name: 'waitlist',
    path: '/waitlist',
    ready: async (page: Page) => {
      await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
      await expect(page.getByTestId(testIds.waitlist.form)).toBeVisible();
    },
  },
  {
    name: 'method',
    path: '/method',
    ready: async (page: Page) => {
      await expect(page.getByTestId('lh-page-ready')).toHaveAttribute('data-state', 'ready');
      await expect(page.getByTestId('lh-hero-method-root')).toBeVisible();
    },
  },
];

for (const locale of locales) {
  for (const route of ROUTES) {
    test(`${locale} ${route.name} accessibility`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await setLocaleCookie(page.context(), locale);
      const target = route.path === '/' ? '/' : localeUrl(route.path, { locale });
      await page.goto(target, { waitUntil: 'domcontentloaded' });
      if (route.path === '/') {
        await expect(page).toHaveURL(new RegExp(`/${locale}/?(?:[?#].*)?$`));
      }
      await route.ready(page);
      await runAxe(page, testInfo, { route: route.name, locale, viewport: 'desktop' });
    });

    test(`@mobile ${locale} ${route.name} accessibility`, async ({ page }, testInfo) => {
      await page.setViewportSize(MOBILE_VIEWPORT);
      await setLocaleCookie(page.context(), locale);
      const target = route.path === '/' ? '/' : localeUrl(route.path, { locale });
      await page.goto(target, { waitUntil: 'domcontentloaded' });
      if (route.path === '/') {
        await expect(page).toHaveURL(new RegExp(`/${locale}/?(?:[?#].*)?$`));
      }
      await route.ready(page);
      await runAxe(page, testInfo, { route: route.name, locale, viewport: 'mobile' });
    });
  }
}
