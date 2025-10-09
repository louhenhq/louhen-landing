import type { MetadataRoute } from 'next';
import {
  buildAlternateLanguageUrlMap,
  buildCanonicalUrl,
} from '@/lib/i18n/metadata';
import { SUPPORTED_LOCALES } from '@/lib/i18n/locales';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const localizedPaths = ['/', '/method/', '/privacy/', '/terms/', '/imprint/'];

  return localizedPaths.flatMap((path) => {
    const languages = buildAlternateLanguageUrlMap(path);

    return SUPPORTED_LOCALES.map(({ value: locale }) => {
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
