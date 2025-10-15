import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { defaultLocale, locales } from './next-intl.locales';

const DEFAULT_LOCALE = defaultLocale;
const SUPPORTED_LOCALES = locales;

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  async redirects() {
    const legacyLocaleRedirects = ['en', 'de', 'fr', 'nl', 'it'].flatMap((legacy) => {
      const target = SUPPORTED_LOCALES.find((value) => value.startsWith(`${legacy}-`));
      if (!target) return [];
      return [
        {
          source: `/${legacy}`,
          destination: `/${target}/`,
          permanent: true,
        },
        {
          source: `/${legacy}/:path*`,
          destination: `/${target}/:path*`,
          permanent: true,
        },
      ];
    });

    return legacyLocaleRedirects;
  },
};

export default withNextIntl(nextConfig);
