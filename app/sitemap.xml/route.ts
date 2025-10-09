import { getSiteOrigin } from '@/lib/seo/shared';
import { getSitemapLocales, sitemapSlugForLocale } from '@lib/shared/seo/sitemap';

export const runtime = 'nodejs';

function buildSitemapIndex(baseUrl: string): string {
  const now = new Date().toISOString();
  const items = getSitemapLocales()
    .map(
      (locale) => `<sitemap>
  <loc>${baseUrl}/sitemaps/${sitemapSlugForLocale(locale)}.xml</loc>
  <lastmod>${now}</lastmod>
</sitemap>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>`;
}

export async function GET(): Promise<Response> {
  const baseUrl = getSiteOrigin();
  const body = buildSitemapIndex(baseUrl);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}
