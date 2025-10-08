import { defaultLocale, type SupportedLocale } from '@/next-intl.locales';

export function imprintPath(locale: SupportedLocale): string {
  return locale === defaultLocale ? '/imprint' : `/${locale}/imprint`;
}
