import type { MetadataRoute } from 'next';
import { isPrelaunch } from '@/lib/env/prelaunch';
import { getSiteOrigin } from '@/lib/seo/shared';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteOrigin();
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
