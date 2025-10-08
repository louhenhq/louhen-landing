import type { MetadataRoute } from 'next';
import { locales } from '@/next-intl.locales';
import {
  buildAlternateLanguageUrlMap,
  buildCanonicalUrl,
} from '@/lib/i18n/metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const localizedPaths = ['/', '/method/', '/privacy/', '/terms/', '/imprint/'];

  return localizedPaths.flatMap((path) => {
    const languages = buildAlternateLanguageUrlMap(path);

    return locales.map((locale) => {
      return {
        url: buildCanonicalUrl(locale, path),
        lastModified: now,
        changeFrequency: path.includes('method') ? 'monthly' : 'weekly',
        priority: path === '/' ? 0.8 : path.includes('method') ? 0.6 : 0.5,
        alternates: {
          languages,
        },
      } satisfies MetadataRoute.Sitemap[number];
    });
  });
}
