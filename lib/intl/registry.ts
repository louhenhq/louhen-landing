import type { NextRequest } from 'next/server';

const SIX_MONTHS_SECONDS = 60 * 60 * 24 * 180;

export const LOCALE_COOKIE = 'lh_locale';
export const X_DEFAULT_LOCALE = 'en-eu';

export const localeDefinitions = [
  {
    locale: 'en-de',
    language: 'en',
    region: 'DE',
    market: 'DE',
    label: 'English — Germany',
    marketLabel: 'Germany',
    hreflang: 'en-DE',
    messageLocale: 'en',
    languageDefault: false,
  },
  {
    locale: 'de-de',
    language: 'de',
    region: 'DE',
    market: 'DE',
    label: 'Deutsch — Deutschland',
    marketLabel: 'Deutschland',
    hreflang: 'de-DE',
    messageLocale: 'de',
    languageDefault: true,
  },
  {
    locale: 'fr-fr',
    language: 'fr',
    region: 'FR',
    market: 'FR',
    label: 'Français — France',
    marketLabel: 'France',
    hreflang: 'fr-FR',
    messageLocale: 'en',
    languageDefault: true,
  },
  {
    locale: 'en-at',
    language: 'en',
    region: 'AT',
    market: 'AT',
    label: 'English — Austria',
    marketLabel: 'Austria',
    hreflang: 'en-AT',
    messageLocale: 'en',
    languageDefault: false,
  },
  {
    locale: 'en-nl',
    language: 'en',
    region: 'NL',
    market: 'NL',
    label: 'English — Netherlands',
    marketLabel: 'Netherlands',
    hreflang: 'en-NL',
    messageLocale: 'en',
    languageDefault: false,
  },
  {
    locale: 'en-eu',
    language: 'en',
    region: 'EU',
    market: 'EU',
    label: 'English — Europe (default)',
    marketLabel: 'European Union',
    hreflang: 'en-EU',
    messageLocale: 'en',
    languageDefault: true,
    isDefault: true,
    isXDefault: true,
  },
] as const;

export type LocaleDefinition = (typeof localeDefinitions)[number];
export type SupportedLocale = LocaleDefinition['locale'];
export type MessageLocale = LocaleDefinition['messageLocale'];
export type LanguageCode = LocaleDefinition['language'];
export type RegionCode = LocaleDefinition['region'];

export const locales: SupportedLocale[] = localeDefinitions.map((definition) => definition.locale);
export const supportedLocales = new Set<SupportedLocale>(locales);

export const defaultLocale: SupportedLocale = X_DEFAULT_LOCALE;

export const marketDefaults: Record<string, SupportedLocale> = {
  DE: 'en-de',
  FR: 'fr-fr',
  AT: 'en-at',
  NL: 'en-nl',
  EU: 'en-eu',
};

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  if (!value) return false;
  return supportedLocales.has(value.toLowerCase() as SupportedLocale);
}

export function normalizeLocale(value: string | null | undefined): SupportedLocale | undefined {
  if (!value) return undefined;
  const lowered = value.trim().toLowerCase();
  if (isSupportedLocale(lowered)) {
    return lowered as SupportedLocale;
  }
  return undefined;
}

export function getLocaleDefinition(locale: SupportedLocale): LocaleDefinition;
export function getLocaleDefinition(locale: string): LocaleDefinition | undefined;
export function getLocaleDefinition(locale: string): LocaleDefinition | undefined {
  const normalized = normalizeLocale(locale);
  if (!normalized) return undefined;
  return localeDefinitions.find((definition) => definition.locale === normalized);
}

export function getLanguageDefault(language: string): SupportedLocale | undefined {
  const lowered = language.trim().toLowerCase();
  const match = localeDefinitions.find(
    (definition) => definition.language === lowered && definition.languageDefault
  );
  return match?.locale;
}

export function getMarketDefault(countryCode: string | null | undefined): SupportedLocale {
  const normalized = (countryCode ?? '').trim().toUpperCase();
  if (normalized && normalized in marketDefaults) {
    return marketDefaults[normalized as keyof typeof marketDefaults];
  }
  return X_DEFAULT_LOCALE;
}

function parseAcceptLanguage(
  header: string | null | undefined
): Array<{ language: string; region?: string; quality: number }> {
  if (!header) return [];
  return header
    .split(',')
    .map((part) => {
      const [tag, qualityToken] = part.trim().split(';');
      const [language, region] = (tag ?? '').toLowerCase().split('-');
      const quality = qualityToken?.startsWith('q=') ? Number.parseFloat(qualityToken.slice(2)) : 1;
      return {
        language: language ?? '',
        region: region ?? undefined,
        quality: Number.isFinite(quality) ? quality : 1,
      };
    })
    .filter((entry) => entry.language.length > 0)
    .sort((a, b) => b.quality - a.quality);
}

function findAcceptLanguageLocale(
  header: string | null | undefined,
  fallbackRegion?: string
): SupportedLocale | undefined {
  const entries = parseAcceptLanguage(header);
  for (const entry of entries) {
    const candidate = normalizeLocale(entry.region ? `${entry.language}-${entry.region}` : undefined);
    if (candidate) return candidate;

    if (fallbackRegion) {
      const fallbackCandidate = normalizeLocale(`${entry.language}-${fallbackRegion.toLowerCase()}`);
      if (fallbackCandidate) return fallbackCandidate;
    }

    const languageDefault = getLanguageDefault(entry.language);
    if (languageDefault) return languageDefault;
  }
  return undefined;
}

export function resolvePreferredLocale({
  cookieLocale,
  acceptLanguage,
  countryCode,
}: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
  countryCode?: string | null;
}): SupportedLocale {
  const normalizedCookie = normalizeLocale(cookieLocale);
  if (normalizedCookie) {
    return normalizedCookie;
  }

  const marketLocale = getMarketDefault(countryCode);
  const marketDefinition = getLocaleDefinition(marketLocale);
  const acceptLocale = findAcceptLanguageLocale(acceptLanguage, marketDefinition?.region);

  if (acceptLocale) {
    return acceptLocale;
  }

  return marketLocale;
}

export function matchLocaleFromPath(pathname: string): { locale: SupportedLocale; remainder: string } | null {
  const segments = pathname.split('/');
  const first = segments[1];
  const normalized = normalizeLocale(first);
  if (!normalized) return null;
  const remainderSegments = segments.slice(2).filter(Boolean);
  const remainder = remainderSegments.length ? `/${remainderSegments.join('/')}` : '/';
  return { locale: normalized, remainder };
}

export function buildLocalePath(
  locale: SupportedLocale,
  pathname: string | undefined | null = '/'
): string {
  const normalizedPath = !pathname || pathname === '/' ? '' : pathname.startsWith('/') ? pathname.slice(1) : pathname;
  return normalizedPath ? `/${locale}/${normalizedPath}` : `/${locale}/`;
}

export function stripLocaleFromPath(pathname: string): { locale: SupportedLocale; pathname: string } | null {
  const match = matchLocaleFromPath(pathname);
  if (!match) return null;
  return { locale: match.locale, pathname: match.remainder };
}

export function detectBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  const value = userAgent.toLowerCase();
  const botSignatures = [
    'bot',
    'spider',
    'crawl',
    'slurp',
    'curl',
    'wget',
    'facebookexternalhit',
    'preview',
    'pingdom',
    'headless',
  ];
  return botSignatures.some((signature) => value.includes(signature));
}

export function extractCountryCode(request: NextRequest): string | null {
  const headerCountry = request.headers.get('x-vercel-ip-country') || request.headers.get('x-forwarded-country');
  if (headerCountry) return headerCountry;
  const geo = (request as { geo?: { country?: string | null } }).geo;
  return geo?.country ?? null;
}

export function appendVaryHeader(response: Response, value: string) {
  const existing = response.headers.get('Vary');
  if (!existing) {
    response.headers.set('Vary', value);
    return;
  }
  const parts = new Set(existing.split(',').map((entry) => entry.trim()).filter(Boolean));
  parts.add(value);
  response.headers.set('Vary', Array.from(parts).join(', '));
}

export function applyLocaleCookie(
  response: Response & { cookies?: { set: (name: string, value: string, options?: Record<string, unknown>) => void } },
  locale: SupportedLocale
) {
  if (!response.cookies) return;
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: SIX_MONTHS_SECONDS,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
