const BASE_LOCALES = ['en', 'de'] as const;
const MARKET_LOCALES = ['en-de', 'de-de', 'de-at'] as const;
const KNOWN_LOCALES = [...BASE_LOCALES, ...MARKET_LOCALES] as const;
export type SupportedLocale = (typeof KNOWN_LOCALES)[number];

const DEFAULT_LOCALES: readonly SupportedLocale[] = KNOWN_LOCALES;

function isSupportedLocale(value: string): value is SupportedLocale {
  return (KNOWN_LOCALES as readonly string[]).includes(value);
}

function normalizeLocales(raw?: string | null): SupportedLocale[] {
  const parts = raw?.split(',').map((value) => value.trim()).filter(Boolean) ?? [];
  const filtered = parts.filter((value): value is SupportedLocale => isSupportedLocale(value));
  const unique = Array.from(new Set(filtered));
  return unique.length ? unique : [...DEFAULT_LOCALES];
}

const fallbackDefault: SupportedLocale = DEFAULT_LOCALES[0] ?? 'en';
const parsedLocales = normalizeLocales(process.env.NEXT_PUBLIC_LOCALES);
const envDefault = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? '').trim();
const normalizedDefault = isSupportedLocale(envDefault) ? envDefault : fallbackDefault;

export const locales: SupportedLocale[] = parsedLocales.length ? parsedLocales : [fallbackDefault];
export const defaultLocale: SupportedLocale =
  locales.includes(normalizedDefault) ? normalizedDefault : locales[0] ?? fallbackDefault;
