import type { MetadataRoute } from 'next';
import { resolveSiteBaseUrl } from '@/lib/i18n/metadata';

export default function robots(): MetadataRoute.Robots {
  const base = resolveSiteBaseUrl();
  const isProduction = process.env.VERCEL_ENV === 'production';
  const allowIndexing = isProduction && process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';

  const rules = allowIndexing
    ? {
        userAgent: '*',
        allow: '/',
      }
    : {
        userAgent: '*',
        disallow: '/',
      };

  return {
    rules,
    sitemap: allowIndexing ? `${base}/sitemap.xml` : undefined,
  };
}
