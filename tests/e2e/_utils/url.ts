const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en-de';
const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:4311').replace(/\/$/, '');

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

export const localeUrl = (path = '', options?: { locale?: string }) => {
  const locale = resolveLocale(options?.locale);
  const localePrefix = `/${locale}`;
  if (!path || path === '/') {
    return new URL(localePrefix, `${BASE_URL}/`).toString();
  }

  if (path.startsWith('?') || path.startsWith('#')) {
    return new URL(`${localePrefix}${path}`, `${BASE_URL}/`).toString();
  }

  const normalised = path.startsWith('/') ? path : `/${path}`;
  return new URL(`${localePrefix}${normalised}`, `${BASE_URL}/`).toString();
};
