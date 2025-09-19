import type { SupportedLocale } from '@/next-intl.locales';

const COOKIE_NAME = 'NEXT_LOCALE';

export function resolveLocale(value: string | undefined | null): SupportedLocale | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  return normalized as SupportedLocale;
}

export function getLocaleFromCookie(cookieValue: string | undefined | null): SupportedLocale | undefined {
  return resolveLocale(cookieValue);
}

export function extractLocaleFromCookies(cookieHeader: string | null | undefined): SupportedLocale | undefined {
  if (!cookieHeader) return undefined;
  const cookies = cookieHeader.split(';');
  for (const entry of cookies) {
    const [rawKey, ...rest] = entry.split('=');
    if (!rawKey) continue;
    if (rawKey.trim() === COOKIE_NAME) {
      return getLocaleFromCookie(rest.join('='));
    }
  }
  return undefined;
}

