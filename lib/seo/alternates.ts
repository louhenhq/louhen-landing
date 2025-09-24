import { resolveBaseUrl } from '@/lib/seo/baseUrl';
import {
  buildLocalePath,
  localeDefinitions,
  type SupportedLocale,
  X_DEFAULT_LOCALE,
} from '@/next-intl.locales';

type AlternateMetadata = {
  canonical: string;
  alternates: {
    canonical: string;
    languages: Record<string, string>;
  };
};

function normalizePath(pathname: string | undefined | null): string {
  if (!pathname) return '/';
  if (pathname === '/') return '/';
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

export async function buildLocaleAlternates(
  locale: SupportedLocale,
  pathname: string | undefined | null = '/'
): Promise<AlternateMetadata> {
  const baseUrl = await resolveBaseUrl();
  const normalizedPath = normalizePath(pathname);

  const canonicalPath = buildLocalePath(locale, normalizedPath);
  const canonicalUrl = `${baseUrl}${canonicalPath}`;

  const languages: Record<string, string> = {};
  for (const definition of localeDefinitions) {
    const localizedPath = buildLocalePath(definition.locale, normalizedPath);
    languages[definition.hreflang] = `${baseUrl}${localizedPath}`;
  }

  const xDefaultPath = buildLocalePath(X_DEFAULT_LOCALE, normalizedPath);
  languages['x-default'] = `${baseUrl}${xDefaultPath}`;

  return {
    canonical: canonicalUrl,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
  };
}
