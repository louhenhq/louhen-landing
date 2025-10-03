import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type AppLocale,
} from '@/lib/i18n/locales';

export type SupportedLocale = AppLocale;
export const locales: SupportedLocale[] = SUPPORTED_LOCALES.map((entry) => entry.value);
export const defaultLocale: SupportedLocale = DEFAULT_LOCALE.value;
