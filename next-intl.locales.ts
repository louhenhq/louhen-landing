const fallbackLocales = ['en', 'de'] as const;
export type SupportedLocale = (typeof fallbackLocales)[number];

function isSupportedLocale(value: string): value is SupportedLocale {
  return (fallbackLocales as readonly string[]).includes(value);
}

function normalizeLocales(raw?: string | null): SupportedLocale[] {
  const parts = raw?.split(',').map((value) => value.trim()).filter(Boolean) ?? [];
  const filtered = parts.filter((value): value is SupportedLocale => isSupportedLocale(value));
  const unique = Array.from(new Set(filtered));
  return unique.length ? unique : [...fallbackLocales];
}

const fallbackDefault: SupportedLocale = 'en';
const parsedLocales = normalizeLocales(process.env.NEXT_PUBLIC_LOCALES);
const envDefault = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? '').trim();
const normalizedDefault = isSupportedLocale(envDefault) ? envDefault : fallbackDefault;

export const locales: SupportedLocale[] = parsedLocales;
export const defaultLocale: SupportedLocale = locales.includes(normalizedDefault) ? normalizedDefault : locales[0];
