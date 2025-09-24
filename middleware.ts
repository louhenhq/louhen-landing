import { NextResponse, type NextRequest } from 'next/server';
import {
  X_DEFAULT_LOCALE,
  detectBot,
  resolvePreferredLocale,
  matchLocaleFromPath,
  buildLocalePath,
  appendVaryHeader,
  applyLocaleCookie,
  extractCountryCode,
  normalizeLocale,
  type SupportedLocale,
} from './next-intl.locales';

function generateNonce() {
  return crypto.randomUUID().replace(/-/g, '');
}

function buildCsp(nonce: string) {
  const scriptSources = ["'self'", `'nonce-${nonce}'`];

  if (process.env.NODE_ENV !== 'production') {
    scriptSources.push("'unsafe-eval'");
  }

  const baseDirectives = [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  const connectSources = new Set<string>([
    "'self'",
    'https://firestore.googleapis.com',
    'https://*.vercel-insights.com',
  ]);

  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    connectSources.add('https://*.vercel.app');
    connectSources.add('ws:');
    connectSources.add('wss:');
  }

  if (process.env.NODE_ENV !== 'production') {
    connectSources.add('http://localhost:3000');
    connectSources.add('ws:');
    connectSources.add('wss:');
  }

  baseDirectives.push(`connect-src ${Array.from(connectSources).join(' ')}`);

  return baseDirectives.join('; ');
}

function shouldHandleHtml(request: NextRequest) {
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('text/html');
}

function applySecurityHeaders(response: NextResponse, nonce: string, isHtml: boolean) {
  if (isHtml) {
    const csp = buildCsp(nonce);
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Content-Security-Policy', csp);
    response.headers.set('Cache-Control', 'private, no-store');
  }
  response.headers.set('x-csp-nonce', nonce);
  appendVaryHeader(response, 'Accept-Language');
  appendVaryHeader(response, 'x-vercel-ip-country');
  appendVaryHeader(response, 'Cookie');
  appendVaryHeader(response, 'User-Agent');
}

function redirectToLocale(request: NextRequest, locale: SupportedLocale, nonce: string) {
  const url = request.nextUrl.clone();
  url.pathname = buildLocalePath(locale);
  const response = NextResponse.redirect(url, 302);
  applyLocaleCookie(response, locale);
  applySecurityHeaders(response, nonce, false);
  return response;
}

function rewriteToLocale(
  request: NextRequest,
  locale: SupportedLocale,
  pathname: string,
  nonce: string,
  requestHeaders: Headers,
  isHtml: boolean
) {
  const url = request.nextUrl.clone();
  url.pathname = buildLocalePath(locale, pathname);
  const response = NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });
  applyLocaleCookie(response, locale);
  applySecurityHeaders(response, nonce, isHtml);
  return response;
}

function nextWithLocale(
  requestHeaders: Headers,
  locale: SupportedLocale,
  nonce: string,
  isHtml: boolean
) {
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  applyLocaleCookie(response, locale);
  applySecurityHeaders(response, nonce, isHtml);
  return response;
}

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-csp-nonce', nonce);

  const isHtml = shouldHandleHtml(request);
  const { pathname } = request.nextUrl;

  if (pathname === '/de' || pathname.startsWith('/de/')) {
    const remainder = pathname === '/de' ? '/' : pathname.slice('/de'.length);
    const targetPath = remainder.startsWith('/') ? remainder : `/${remainder}`;
    const locale = 'de-de' as SupportedLocale;
    const url = request.nextUrl.clone();
    url.pathname = buildLocalePath(locale, targetPath);
    const redirect = NextResponse.redirect(url, 308);
    applyLocaleCookie(redirect, locale);
    applySecurityHeaders(redirect, nonce, false);
    return redirect;
  }

  const localeFromPath = matchLocaleFromPath(pathname);
  if (localeFromPath) {
    requestHeaders.set('x-active-locale', localeFromPath.locale);
    return nextWithLocale(requestHeaders, localeFromPath.locale, nonce, isHtml);
  }

  if (pathname === '/' || pathname === '') {
    const userAgent = request.headers.get('user-agent');
    if (detectBot(userAgent)) {
      requestHeaders.set('x-active-locale', X_DEFAULT_LOCALE);
      return rewriteToLocale(request, X_DEFAULT_LOCALE, '/', nonce, requestHeaders, isHtml);
    }

    const cookieLocale = request.cookies.get('lh_locale')?.value ?? null;
    const acceptLanguage = request.headers.get('accept-language');
    const countryCode = extractCountryCode(request);
    const resolvedLocale = resolvePreferredLocale({
      cookieLocale,
      acceptLanguage,
      countryCode,
    });

    requestHeaders.set('x-active-locale', resolvedLocale);
    return redirectToLocale(request, resolvedLocale, nonce);
  }

  const normalizedCookie = normalizeLocale(request.cookies.get('lh_locale')?.value ?? undefined);
  const localeForRewrite = normalizedCookie ?? X_DEFAULT_LOCALE;
  requestHeaders.set('x-active-locale', localeForRewrite);
  return rewriteToLocale(request, localeForRewrite, pathname, nonce, requestHeaders, isHtml);
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
