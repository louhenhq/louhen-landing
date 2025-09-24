import type { MetadataRoute } from 'next';

import { resolveBaseUrl } from '@/lib/seo/baseUrl';
import { defaultLocale, locales, buildLocalePath } from '@/next-intl.locales';

const STATIC_LOCALE_SEGMENTS = ['/', '/method', '/privacy', '/terms', '/imprint'] as const;
const GUIDE_SEGMENTS = ['', '/healthy-feet', '/sizing', '/parenting'] as const;
const GUIDE_ARTICLE_SEGMENTS = ['/articles/choosing-first-shoes'] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await resolveBaseUrl();
  const now = new Date().toISOString();

  const homeEntry: MetadataRoute.Sitemap[number] = {
    url: `${base}/`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 1,
  };

  const localizedStaticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    STATIC_LOCALE_SEGMENTS.map((segment) => {
      const path = buildLocalePath(locale, segment);
      return {
        url: `${base}${path}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: segment === '/' ? 0.9 : 0.6,
      } satisfies MetadataRoute.Sitemap[number];
    })
  );

  const guideEntries: MetadataRoute.Sitemap = locales.flatMap((locale) => {
    const indexAndTopics = GUIDE_SEGMENTS.map((segment) => {
      const targetPath = segment === '' ? '/guides' : `/guides${segment}`;
      const path = buildLocalePath(locale, targetPath);

      return {
        url: `${base}${path}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      } satisfies MetadataRoute.Sitemap[number];
    });

    const articles = GUIDE_ARTICLE_SEGMENTS.map((segment) => ({
      url: `${base}${buildLocalePath(locale, `/guides${segment}`)}`,
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

  return [homeEntry, ...localizedStaticEntries, ...guideEntries, ...aliasEntries];
}
