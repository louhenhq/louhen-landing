import { SUPPORTED_LOCALES } from '@/lib/i18n/locales';

const LOCALE_SPECIFIC_PATHS: Record<string, string> = {
  'en-de': '/en-de/help/sizing',
  'de-de': '/de-de/hilfe/messen',
};

const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES.map((entry) => entry.value));

export function getHelpSizingPath(locale: string): string | null {
  if (!SUPPORTED_LOCALE_SET.has(locale)) {
    return null;
  }

  return LOCALE_SPECIFIC_PATHS[locale] ?? null;
}
