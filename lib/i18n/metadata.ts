import { getSiteOrigin } from '@/lib/env/site-origin';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, buildPathForLocale, buildUrlForLocale, type AppLocale } from './locales';

export function resolveSiteBaseUrl(): string {
  return getSiteOrigin();
}

function ensureLeadingSlash(path: string): string {
  if (!path.startsWith('/')) {
    return `/${path}`;
  }
  return path;
}

export function buildCanonicalPath(locale: AppLocale, pathname: string): string {
  const normalizedPath = ensureLeadingSlash(pathname);
  return buildPathForLocale(locale, normalizedPath);
}

export function buildCanonicalUrl(locale: AppLocale, pathname: string): string {
  const baseUrl = getSiteOrigin();
  return buildUrlForLocale(baseUrl, locale, pathname);
}

export function buildAlternateLanguageMap(pathname: string): Record<string, string> {
  const normalizedPath = ensureLeadingSlash(pathname);

  const languages = SUPPORTED_LOCALES.reduce<Record<string, string>>((acc, descriptor) => {
    acc[descriptor.hrefLang] = buildPathForLocale(descriptor.value, normalizedPath);
    return acc;
  }, {});

  languages['x-default'] = buildPathForLocale(DEFAULT_LOCALE.value, normalizedPath);

  return languages;
}

export function buildAlternateLanguageUrlMap(pathname: string): Record<string, string> {
  const baseUrl = getSiteOrigin();
  const normalizedPath = ensureLeadingSlash(pathname);

  const languages = SUPPORTED_LOCALES.reduce<Record<string, string>>((acc, descriptor) => {
    acc[descriptor.hrefLang] = buildUrlForLocale(baseUrl, descriptor.value, normalizedPath);
    return acc;
  }, {});

  languages['x-default'] = buildUrlForLocale(baseUrl, DEFAULT_LOCALE.value, normalizedPath);

  return languages;
}
