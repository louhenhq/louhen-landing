const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en-de';
const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:4311').replace(/\/$/, '');

export const getDefaultLocale = () => DEFAULT_LOCALE;

export const localeUrl = (path = '', options?: { locale?: string }) => {
  const locale = options?.locale ?? DEFAULT_LOCALE;
  if (!path || path === '/') {
    return new URL(`/${locale}`, `${BASE_URL}/`).toString();
  }

  if (path.startsWith('?') || path.startsWith('#')) {
    return new URL(`/${locale}${path}`, `${BASE_URL}/`).toString();
  }

  const normalised = path.startsWith('/') ? path : `/${path}`;
  return new URL(`/${locale}${normalised}`, `${BASE_URL}/`).toString();
};
