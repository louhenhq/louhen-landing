import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { defaultLocale } from './next-intl.locales';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/method',
        destination: `/${defaultLocale}/method/`,
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
