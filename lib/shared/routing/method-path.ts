import { defaultLocale, type SupportedLocale } from '@/next-intl.locales';

export function methodPath(locale: SupportedLocale): string {
  return locale === defaultLocale ? '/method' : `/${locale}/method`;
}
