import type { MetadataRoute } from 'next';
import { locales } from '@/next-intl.locales';

const FALLBACK_SITE_URL = 'https://louhen-landing.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const rawBase = process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL;
  const baseUrl = rawBase.replace(/\/$/, '');
  const now = new Date().toISOString();

  const localizedPaths = ['', 'method/', 'privacy/', 'terms/', 'imprint/'];

  const entries: MetadataRoute.Sitemap = [];

  entries.push({
    url: `${baseUrl}/`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 1,
  });

  for (const locale of locales) {
    for (const path of localizedPaths) {
      const pathname = path ? `/${locale}/${path}` : `/${locale}/`;
      entries.push({
        url: `${baseUrl}${pathname}`,
        lastModified: now,
        changeFrequency: path.includes('method') ? 'monthly' : 'weekly',
        priority: path === '' ? 0.8 : path.includes('method') ? 0.6 : 0.5,
      });
    }
  }

  return entries;
}
