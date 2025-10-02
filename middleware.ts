import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { config as intlRoutingConfig } from './next-intl.config';
import { SUPPORTED_LOCALES, isSupportedLocale } from './lib/i18n/locales';

const intlMiddleware = createIntlMiddleware({
  ...intlRoutingConfig,
  localePrefix: 'as-needed',
});

function generateNonce() {
  return crypto.randomUUID().replace(/-/g, '');
}

function buildCsp(nonce: string) {
  const baseDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  const connectSources = [
    "'self'",
    'https://firestore.googleapis.com',
    'https://*.vercel-insights.com',
  ];

  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    connectSources.push('https://*.vercel.app', 'ws:', 'wss:');
  }

  baseDirectives.push(`connect-src ${connectSources.join(' ')}`);

  return baseDirectives.join('; ');
}

function shouldHandleHtml(request: NextRequest) {
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/html');
}

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  request.headers.set('x-csp-nonce', nonce);

  const pathname = request.nextUrl.pathname;
  const rawLocaleMatch = pathname.match(/^\/([A-Za-z]{2}-[A-Za-z]{2})(?=\/|$)/);

  if (rawLocaleMatch) {
    const rawLocale = rawLocaleMatch[1];
    const normalizedLocale = rawLocale.toLowerCase();

    if (rawLocale !== normalizedLocale && isSupportedLocale(normalizedLocale)) {
      const updatedPathname = pathname.replace(`/${rawLocale}`, `/${normalizedLocale}`);
      const url = request.nextUrl.clone();
      url.pathname = updatedPathname;
      return NextResponse.redirect(url, 308);
    }
  }

  const response = intlMiddleware(request);

  if (!shouldHandleHtml(request)) {
    return response;
  }

  const csp = buildCsp(nonce);

  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-csp-nonce', nonce);

  return response;
}

export const config = {
  matcher: ['/', '/(de-de|en-de|fr-fr)', '/(de-de|en-de|fr-fr)/:path*'],
};
