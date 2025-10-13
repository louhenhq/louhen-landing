import { localeHomePath, legalPath } from '@lib/shared/routing/legal-path';
import { methodPath } from '@lib/shared/routing/method-path';
import { imprintPath } from '@lib/shared/routing/imprint-path';
import { waitlistLandingPath } from '@lib/shared/routing/waitlist-path';
import { locales, type SupportedLocale } from '@/next-intl.locales';

export const SITEMAP_SLUG_PREFIX = 'sitemap-';

export function getSitemapLocales(): SupportedLocale[] {
  return locales;
}

export function sitemapSlugForLocale(locale: SupportedLocale): string {
  return `${SITEMAP_SLUG_PREFIX}${locale}`;
}

export function canonicalPathsForLocale(locale: SupportedLocale): string[] {
  const entries = new Set<string>();
  entries.add(localeHomePath(locale));
  entries.add(methodPath(locale));
  entries.add(legalPath(locale, 'privacy'));
  entries.add(legalPath(locale, 'terms'));
  entries.add(imprintPath(locale));

  entries.add(waitlistLandingPath(locale));

  return Array.from(entries);
}
