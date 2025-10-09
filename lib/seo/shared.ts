import { getSiteOrigin } from '@/lib/env/site-origin';
import { defaultLocale, locales, type SupportedLocale } from '@/next-intl.locales';

function ensureLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export function makeCanonical(path: string, baseUrl: string = getSiteOrigin()): string {
  return `${baseUrl}${ensureLeadingSlash(path)}`;
}

export function hreflangMapFor(
  pathBuilder: (locale: SupportedLocale) => string,
  baseUrl: string = getSiteOrigin(),
): Record<string, string> {
  const entries: Record<string, string> = {};

  for (const locale of locales) {
    entries[locale] = makeCanonical(pathBuilder(locale), baseUrl);
  }

  entries['x-default'] = makeCanonical(pathBuilder(defaultLocale), baseUrl);

  return entries;
}

export { getSiteOrigin };
