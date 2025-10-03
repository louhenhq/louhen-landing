import type { MetadataRoute } from 'next';
import { locales } from '@/next-intl.locales';
import {
  buildAlternateLanguageUrlMap,
  buildCanonicalUrl,
} from '@/lib/i18n/metadata';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const marketingPaths: readonly string[] = ['/', '/privacy/', '/terms/', '/imprint/'];

  const createLocalizedEntries = (
    path: string,
    options: {
      changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
      priority: number;
    }
  ): MetadataRoute.Sitemap => {
    const normalizedPath = ensureTrailingSlash(path);
    const languages = buildAlternateLanguageUrlMap(normalizedPath);

    return locales.map((locale) => {
      return {
        url: buildCanonicalUrl(locale, normalizedPath),
        lastModified: now,
        changeFrequency: options.changeFrequency,
        priority: options.priority,
        alternates: {
          languages,
        },
      } satisfies MetadataRoute.Sitemap[number];
    });
  };

  const marketingEntries = marketingPaths.flatMap((path) =>
    createLocalizedEntries(path, {
      changeFrequency: 'weekly',
      priority: path === '/' ? 0.8 : 0.5,
    })
  );

  const methodEntries = createLocalizedEntries('/method/', {
    changeFrequency: 'monthly',
    priority: 0.6,
  });

  return [...marketingEntries, ...methodEntries];
}

function ensureTrailingSlash(path: string): string {
  if (!path.endsWith('/')) {
    return `${path}/`;
  }
  return path;
}
