import { defaultLocale, locales, type SupportedLocale } from '@/next-intl.locales';

const FALLBACK_SITE_URL = 'https://louhen-landing.vercel.app';

export function resolveBaseUrl(): string {
  const raw = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL;
  return raw.replace(/\/$/, '');
}

function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export function makeCanonical(path: string, baseUrl: string = resolveBaseUrl()): string {
  return `${baseUrl}${ensureLeadingSlash(path)}`;
}

export function hreflangMapFor(
  pathBuilder: (locale: SupportedLocale) => string,
  baseUrl: string = resolveBaseUrl(),
): Record<string, string> {
  const entries: Record<string, string> = {};

  for (const locale of locales) {
    entries[locale] = makeCanonical(pathBuilder(locale), baseUrl);
  }

  entries['x-default'] = makeCanonical(pathBuilder(defaultLocale), baseUrl);

  return entries;
}
