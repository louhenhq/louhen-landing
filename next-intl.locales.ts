const BASE_LOCALES = ['en', 'de', 'fr', 'nl', 'it'] as const;
const MARKET_LOCALES = ['en-de', 'de-de', 'fr-fr', 'nl-nl', 'it-it'] as const;
const KNOWN_LOCALES = [...BASE_LOCALES, ...MARKET_LOCALES] as const;
export type SupportedLocale = (typeof KNOWN_LOCALES)[number];

const DEFAULT_MARKET_LOCALES: readonly SupportedLocale[] = MARKET_LOCALES;
const DEFAULT_LOCALES: readonly SupportedLocale[] = DEFAULT_MARKET_LOCALES;
const FALLBACK_DEFAULT_LOCALE: SupportedLocale = 'de-de';

function isSupportedLocale(value: string): value is SupportedLocale {
  return (KNOWN_LOCALES as readonly string[]).includes(value);
}

function normalizeLocales(raw?: string | null): SupportedLocale[] {
  const parts = raw?.split(',').map((value) => value.trim()).filter(Boolean) ?? [];
  const filtered = parts.filter((value): value is SupportedLocale => isSupportedLocale(value));
  const unique = Array.from(new Set(filtered));
  return unique.length ? unique : [...DEFAULT_LOCALES];
}

const fallbackDefault: SupportedLocale = FALLBACK_DEFAULT_LOCALE;
const parsedLocales = normalizeLocales(process.env.NEXT_PUBLIC_LOCALES);
const envDefault = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? '').trim();
const normalizedDefault = isSupportedLocale(envDefault) ? envDefault : fallbackDefault;

export const locales: SupportedLocale[] =
  parsedLocales.length ? parsedLocales : [...DEFAULT_MARKET_LOCALES];
export const defaultLocale: SupportedLocale =
  locales.includes(normalizedDefault) ? normalizedDefault : locales[0] ?? fallbackDefault;
