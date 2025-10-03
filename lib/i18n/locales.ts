import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, COOKIE_PATH, COOKIE_SAME_SITE } from '../theme/constants';

export const FULL_LOCALES = ['en-de', 'de-de'] as const;

export type AppLocale = (typeof FULL_LOCALES)[number];

export type LocaleDescriptor = {
  value: AppLocale;
  label: string;
  nativeName: string;
  language: string;
  region: string;
  hrefLang: string;
  isDefault: boolean;
};

export const SUPPORTED_LOCALES: LocaleDescriptor[] = [
  {
    value: 'en-de',
    label: 'English (Germany)',
    nativeName: 'English (Deutschland)',
    language: 'en',
    region: 'DE',
    hrefLang: 'en-DE',
    isDefault: true,
  },
  {
    value: 'de-de',
    label: 'Deutsch (Deutschland)',
    nativeName: 'Deutsch (Deutschland)',
    language: 'de',
    region: 'DE',
    hrefLang: 'de-DE',
    isDefault: false,
  },
];

export const DEFAULT_LOCALE = SUPPORTED_LOCALES.find((entry) => entry.isDefault) ?? SUPPORTED_LOCALES[0];

export const SHORT_TO_FULL: Record<string, AppLocale> = {
  en: 'en-de',
  de: 'de-de',
};

export const LOCALE_SEGMENT_PATTERN = /^\/([a-z]{2}-[a-z]{2})(?=\/|$)/;

export function extractLocaleFromPath(pathname: string): AppLocale | null {
  const match = pathname.match(LOCALE_SEGMENT_PATTERN);
  if (!match) {
    return null;
  }

  const candidate = match[1];
  return isSupportedLocale(candidate) ? candidate : null;
}

export function stripLocaleFromPath(pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const without = normalized.replace(LOCALE_SEGMENT_PATTERN, '');
  return without.length ? without : '/';
}

export function isSupportedLocale(value: string | null | undefined): value is AppLocale {
  return SUPPORTED_LOCALES.some((entry) => entry.value === value);
}

export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (value && isSupportedLocale(value)) return value;
  return DEFAULT_LOCALE.value;
}

function normalizePathname(pathname: string): string {
  if (!pathname.length) {
    return '/';
  }
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

export function splitLocale(locale: AppLocale): { language: string; region: string } {
  const [language, region] = locale.split('-');
  return { language, region } as { language: string; region: string };
}

export function buildPathForLocale(targetLocale: AppLocale, pathname: string): string {
  const normalizedPath = normalizePathname(pathname);
  const withoutLocale = normalizedPath.replace(LOCALE_SEGMENT_PATTERN, '');
  const suffix = withoutLocale === '/' || withoutLocale === '' ? '/' : withoutLocale;
  return `/${targetLocale}${suffix}`;
}

export function buildUrlForLocale(baseUrl: string, targetLocale: AppLocale, pathname: string): string {
  const path = buildPathForLocale(targetLocale, pathname);
  return `${baseUrl}${path}`;
}

export function getHrefLangEntries(baseUrl: string, pathname: string) {
  return SUPPORTED_LOCALES.map((locale) => ({
    hrefLang: locale.hrefLang,
    href: buildUrlForLocale(baseUrl, locale.value, pathname),
  }));
}

export function getXDefaultHref(baseUrl: string, pathname: string) {
  return buildUrlForLocale(baseUrl, DEFAULT_LOCALE.value, pathname);
}

export function buildLocaleCookie(value: AppLocale | 'system') {
  if (value === 'system') {
    return `${LOCALE_COOKIE}=; Path=${COOKIE_PATH}; Max-Age=0; SameSite=${COOKIE_SAME_SITE}`;
  }
  return `${LOCALE_COOKIE}=${encodeURIComponent(value)}; Path=${COOKIE_PATH}; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=${COOKIE_SAME_SITE}`;
}

type ParsedLanguagePreference = {
  language: string;
  region: string | null;
  quality: number;
};

function parseAcceptLanguage(headerValue: string): ParsedLanguagePreference[] {
  return headerValue
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [range, ...rawParameters] = entry.split(';');
      const params = rawParameters.map((param) => param.trim());

      let quality = 1;
      for (const param of params) {
        const [key, value] = param.split('=');
        if (key?.toLowerCase() === 'q' && value) {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) {
            quality = parsed;
          }
        }
      }

      const [languagePart, regionPart] = range.trim().toLowerCase().split('-');
      const language = languagePart?.replace(/[^a-z]/g, '') ?? '';
      const region = regionPart ? regionPart.replace(/[^a-z]/g, '') : null;

      return { language, region, quality } satisfies ParsedLanguagePreference;
    })
    .filter((entry) => entry.language.length > 0)
    .sort((a, b) => b.quality - a.quality);
}

export function resolveLocaleFromAcceptLanguage(headerValue: string | null | undefined): AppLocale | null {
  if (!headerValue) {
    return null;
  }

  const preferences = parseAcceptLanguage(headerValue);
  if (!preferences.length) {
    return null;
  }

  for (const preference of preferences) {
    const { language, region } = preference;
    const normalized = region ? `${language}-${region}` : null;

    if (normalized && isSupportedLocale(normalized)) {
      return normalized;
    }

    const languageMatch = SUPPORTED_LOCALES.find((entry) => entry.language === language);
    if (languageMatch) {
      return languageMatch.value;
    }
  }

  return null;
}
