import type { MetadataRoute } from 'next';

import { resolveBaseUrl } from '@/lib/seo/baseUrl';
import { defaultLocale, locales } from '@/next-intl.locales';

const STATIC_PATHS = ['', '/method', '/privacy', '/terms', '/imprint'] as const;
const GUIDE_SEGMENTS = ['', '/healthy-feet', '/sizing', '/parenting'] as const;
const GUIDE_ARTICLE_SEGMENTS = ['/articles/choosing-first-shoes'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await resolveBaseUrl();
  const now = new Date().toISOString();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.6,
  }));

  const guideEntries: MetadataRoute.Sitemap = locales.flatMap((locale) => {
    const indexAndTopics = GUIDE_SEGMENTS.map((segment) => {
      const path = segment === '' ? `/${locale}/guides` : `/${locale}/guides${segment}`;

      return {
        url: `${base}${path}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      } satisfies MetadataRoute.Sitemap[number];
    });

    const articles = GUIDE_ARTICLE_SEGMENTS.map((segment) => ({
      url: `${base}/${locale}/guides${segment}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    } satisfies MetadataRoute.Sitemap[number]));

    return [...indexAndTopics, ...articles];
  });

const hasDefaultAlias = Boolean(defaultLocale);
const aliasEntries: MetadataRoute.Sitemap = hasDefaultAlias
  ? [
      ...GUIDE_SEGMENTS.map((segment) => ({
        url: `${base}${segment === '' ? '/guides' : `/guides${segment}`}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      } satisfies MetadataRoute.Sitemap[number])),
      ...GUIDE_ARTICLE_SEGMENTS.map((segment) => ({
        url: `${base}/guides${segment}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
      } satisfies MetadataRoute.Sitemap[number])),
    ]
  : [];

  return [...staticEntries, ...guideEntries, ...aliasEntries];
}
