import createMiddleware from 'next-intl/middleware';
import { config as intlRoutingConfig } from './next-intl.config';

export default createMiddleware({
  ...intlRoutingConfig,
  localePrefix: 'as-needed',
});

export const config = {
  matcher: ['/', '/(en|de)', '/(en|de)/:path*'],
};
