import type { MetadataRoute } from 'next';
import { SUPPORTED_LOCALES } from '@/lib/i18n/locales';
import { localeHomePath, legalPath, type LegalSlug } from '@lib/shared/routing/legal-path';
import { methodPath } from '@lib/shared/routing/method-path';
import { waitlistLandingPath } from '@lib/shared/routing/waitlist-path';
import { imprintPath } from '@lib/shared/routing/imprint-path';
import { hreflangMapFor, makeCanonical } from '@/lib/seo/shared';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const routes: Array<{
    buildPath: (locale: string) => string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: MetadataRoute.Sitemap[number]['priority'];
  }> = [
    {
      buildPath: localeHomePath,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      buildPath: methodPath,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      buildPath: waitlistLandingPath,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...(['privacy', 'terms'] as LegalSlug[]).map((slug) => ({
      buildPath: (locale: string) => legalPath(locale, slug),
      changeFrequency: 'monthly' as const,
      priority: 0.4 as const,
    })),
    {
      buildPath: imprintPath,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  return routes.flatMap(({ buildPath, changeFrequency, priority }) => {
    const languages = hreflangMapFor(buildPath);

    return SUPPORTED_LOCALES.map(({ value: locale }) => ({
      url: makeCanonical(buildPath(locale)),
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages,
      },
    }));
  });
}
