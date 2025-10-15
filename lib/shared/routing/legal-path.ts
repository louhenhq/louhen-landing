import { defaultLocale } from '@/next-intl.locales';

export type LegalSlug = 'terms' | 'privacy';

export function legalPath(locale: string, slug: LegalSlug): string {
  return `/${locale}/legal/${slug}`;
}

export function localeHomePath(locale: string): string {
  return locale === defaultLocale ? '/' : `/${locale}`;
}
