import { LOCALE_COOKIE, normalizeLocale, type SupportedLocale } from '@/next-intl.locales';

export function resolveLocale(value: string | undefined | null): SupportedLocale | undefined {
  return normalizeLocale(value ?? undefined);
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
    if (rawKey.trim() === LOCALE_COOKIE) {
      return getLocaleFromCookie(rest.join('='));
    }
  }
  return undefined;
}
