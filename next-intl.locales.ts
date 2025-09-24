export {
  locales,
  defaultLocale,
  localeDefinitions,
  supportedLocales,
  marketDefaults,
  normalizeLocale,
  getLocaleDefinition,
  getMarketDefault,
  matchLocaleFromPath,
  buildLocalePath,
  stripLocaleFromPath,
  resolvePreferredLocale,
  detectBot,
  LOCALE_COOKIE,
  X_DEFAULT_LOCALE,
  appendVaryHeader,
  applyLocaleCookie,
  extractCountryCode,
} from './lib/intl/registry';

export type { SupportedLocale, LocaleDefinition, MessageLocale } from './lib/intl/registry';
