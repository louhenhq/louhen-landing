import type { BrowserContext } from '@playwright/test';

const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'de-de';
const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:4311').replace(/\/$/, '');
const LOCALE_COOKIE = process.env.NEXT_LOCALE_COOKIE ?? 'NEXT_LOCALE';
const COOKIE_DOMAIN = (() => {
  try {
    return new URL(`${BASE_URL}/`).hostname;
  } catch {
    return '127.0.0.1';
  }
})();

const declaredLocales = (process.env.NEXT_PUBLIC_LOCALES ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const FALLBACK_LOCALES = Array.from(new Set([DEFAULT_LOCALE, 'de-de']));
const TEST_LOCALES = declaredLocales.length ? declaredLocales : FALLBACK_LOCALES;

const resolveLocale = (locale?: string) => {
  if (locale && TEST_LOCALES.includes(locale)) {
    return locale;
  }
  if (locale === 'en' || locale === 'en-US') {
    return DEFAULT_LOCALE;
  }
  if (locale && locale.startsWith('de')) {
    return TEST_LOCALES.find((value) => value.startsWith('de')) ?? 'de-de';
  }
  return DEFAULT_LOCALE;
};

export const getDefaultLocale = () => DEFAULT_LOCALE;

export const getTestLocales = () => TEST_LOCALES;

export const getBaseUrl = () => BASE_URL;

export const getCookieDomain = () => COOKIE_DOMAIN;

export const localeCookieName = () => LOCALE_COOKIE;

export const localeUrl = (path = '', options?: { locale?: string }) => {
  const locale = resolveLocale(options?.locale);
  const localePrefix = `/${locale}`;
  if (!path || path === '/') {
    return '/';
  }

  if (path.startsWith('?') || path.startsWith('#')) {
    return `${localePrefix}${path}`;
  }

  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${localePrefix}${normalised}`;
};

export const absoluteLocaleUrl = (path = '', options?: { locale?: string }) => {
  return new URL(localeUrl(path, options), `${BASE_URL}/`).toString();
};

export const setLocaleCookie = async (context: BrowserContext, locale?: string) => {
  await context.addCookies([
    {
      name: LOCALE_COOKIE,
      value: resolveLocale(locale),
      domain: COOKIE_DOMAIN,
      path: '/',
    },
  ]);
};
