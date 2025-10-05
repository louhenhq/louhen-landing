import type { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/next-intl.locales';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://louhen-landing.vercel.app').replace(/\/$/, '');
  const now = new Date().toISOString();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/method`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  const legalEntries: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${base}/${locale}/legal/privacy`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.2,
  }));

  const defaultTermsEntry: MetadataRoute.Sitemap = [
    {
      url: `${base}/${defaultLocale}/legal/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.2,
    },
  ];

  return [...staticEntries, ...legalEntries, ...defaultTermsEntry];
}
