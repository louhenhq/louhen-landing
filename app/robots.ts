import type { MetadataRoute } from 'next';
import { isPrelaunch } from '@/lib/env/prelaunch';
import { resolveBaseUrl } from '@/lib/seo/shared';

export default function robots(): MetadataRoute.Robots {
  const base = resolveBaseUrl();
  if (isPrelaunch()) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
