import { canonicalPathsForLocale, getSitemapLocales, SITEMAP_SLUG_PREFIX } from '@lib/shared/seo/sitemap';
import type { SupportedLocale } from '@/next-intl.locales';
import { getSiteOrigin, makeCanonical } from '@/lib/seo/shared';

export const runtime = 'nodejs';

type RouteParams = {
  params: { slug: string };
};

const LOCALE_SET = new Set<SupportedLocale>(getSitemapLocales());

function parseLocaleFromSlug(slug: string): SupportedLocale | null {
  let normalized = slug.trim();
  if (!normalized) return null;
  if (normalized.endsWith('.xml')) {
    normalized = normalized.slice(0, -4);
  }
  if (!normalized.startsWith(SITEMAP_SLUG_PREFIX)) {
    return null;
  }
  const candidate = normalized.slice(SITEMAP_SLUG_PREFIX.length) as SupportedLocale;
  return LOCALE_SET.has(candidate) ? candidate : null;
}

function buildLocaleSitemap(locale: SupportedLocale, baseUrl: string): string {
  const timestamp = new Date().toISOString();
  const urls = canonicalPathsForLocale(locale)
    .map((path) => `<url>
  <loc>${makeCanonical(path, baseUrl)}</loc>
  <lastmod>${timestamp}</lastmod>
</url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export async function GET({ params }: RouteParams): Promise<Response> {
  const locale = parseLocaleFromSlug(params.slug);
  if (!locale) {
    return new Response('Not Found', { status: 404 });
  }

  const baseUrl = getSiteOrigin();
  const body = buildLocaleSitemap(locale, baseUrl);

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}
