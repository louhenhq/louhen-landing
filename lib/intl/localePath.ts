import { resolveLocale } from '@/lib/intl/getLocale';
import { defaultLocale, locales, type SupportedLocale } from '@/next-intl.locales';

function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  if (!pathname.startsWith('/')) return `/${pathname}`;
  return pathname.length === 0 ? '/' : pathname;
}

function sanitizeInternalPath(pathname: string): string {
  try {
    const url = new URL(pathname, 'https://placeholder.invalid');
    return url.pathname || '/';
  } catch {
    return normalizePathname(pathname);
  }
}

function sanitizeSearch(search: string | null | undefined): string {
  if (!search) return '';
  if (search.startsWith('?')) return search.slice(1);
  return search;
}

export function extractLocaleFromPath(pathname: string): {
  locale: SupportedLocale;
  pathWithoutLocale: string;
} {
  const normalized = normalizePathname(pathname);
  const segments = normalized.split('/').filter(Boolean);
  const candidate = segments[0];
  const supportedLocales = new Set<SupportedLocale>(locales);
  const hasLocale = candidate && supportedLocales.has(candidate as SupportedLocale);
  const rest = hasLocale ? segments.slice(1) : segments;
  const pathWithoutLocale = rest.length ? `/${rest.join('/')}` : '/';
  return {
    locale: hasLocale ? (candidate as SupportedLocale) : defaultLocale,
    pathWithoutLocale,
  };
}

export function buildLocalePath(targetLocale: SupportedLocale, pathname: string): string {
  const sanitized = sanitizeInternalPath(pathname);
  const { pathWithoutLocale } = extractLocaleFromPath(sanitized);
  if (targetLocale === defaultLocale) {
    return pathWithoutLocale;
  }
  if (pathWithoutLocale === '/') {
    return `/${targetLocale}`;
  }
  return `/${targetLocale}${pathWithoutLocale}`;
}

export function buildLocaleHref(
  targetLocale: SupportedLocale,
  pathname: string,
  search: string | null | undefined
): string {
  const basePath = buildLocalePath(targetLocale, pathname);
  const sanitizedSearch = sanitizeSearch(search);
  return sanitizedSearch ? `${basePath}?${sanitizedSearch}` : basePath;
}

export function resolveTargetLocale(value: string | null | undefined): SupportedLocale {
  return resolveLocale(value) ?? defaultLocale;
}
