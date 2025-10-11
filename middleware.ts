import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { config as intlRoutingConfig } from './next-intl.config';
import {
  FULL_LOCALES,
  SHORT_TO_FULL,
  DEFAULT_LOCALE,
  buildPathForLocale,
  resolveLocaleFromAcceptLanguage,
  type AppLocale,
} from '@/lib/i18n/locales';
import { extractLocaleFromCookies } from '@/lib/intl/getLocale';
import { getFlags, isProduction } from '@/lib/shared/flags';
import { COOKIE_PATH, COOKIE_SAME_SITE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from '@/lib/theme/constants';

const intlMiddleware = createIntlMiddleware({
  ...intlRoutingConfig,
  localePrefix: 'as-needed',
});

const SUPPORTED_LOCALE_VALUES = new Set(FULL_LOCALES.map((value) => value.toLowerCase()));
const ALREADY_LOCALIZED = /^\/([a-z]{2}-[a-z]{2})(?=\/|$)/i;
const SHORT_LOCALE_SEGMENT = /^\/([a-z]{2})(?=\/|$)/i;
const allowIndexOverride = process.env.LH_ALLOW_INDEX === 'true';
const LOCALE_REDIRECT_COOKIE = '__ll_locale_redirect';
const LOCALE_REDIRECT_MAX_AGE = 5;
const NEXT_LOCALE_COOKIE = 'NEXT_LOCALE';
const STATIC_PATH_PREFIXES = ['/assets', '/opengraph-image'];
const STATIC_PATH_EXACT = new Set([
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/icon.svg',
]);
const EXTENSION_PATTERN = /\.[a-z0-9]+$/i;

const HSTS_MAX_AGE_SECONDS = 60 * 60 * 24 * 730; // 2 years
function generateNonce() {
  return crypto.randomUUID().replace(/-/g, '');
}

type BuildCspOptions = {
  nonce: string;
  isDev: boolean;
};

function buildCsp({ nonce, isDev }: BuildCspOptions) {
  const directives: Record<string, Set<string>> = {
    'default-src': new Set(["'self'"]),
    'script-src': new Set(["'self'", `'nonce-${nonce}'`]),
    'style-src': new Set(["'self'", "'unsafe-inline'"]),
    'img-src': new Set(["'self'", 'data:']),
    'font-src': new Set(["'self'"]),
    'connect-src': new Set(["'self'"]),
    'frame-ancestors': new Set(["'none'"]),
    'base-uri': new Set(["'self'"]),
    'form-action': new Set(["'self'"]),
  };

  if (isDev) {
    directives['script-src'].add("'unsafe-eval'");
    directives['connect-src'].add('ws:');
    directives['connect-src'].add('wss:');
    directives['connect-src'].add('http://localhost:*');
    directives['connect-src'].add('https://localhost:*');
  }

  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${Array.from(values).join(' ')}`)
    .join('; ');
}

function shouldApplySecurityHeaders(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/_next/static') || pathname.startsWith('/_next/image')) {
    return false;
  }
  if (pathname.startsWith('/api')) {
    return false;
  }
  if (pathname.endsWith('.ico') || pathname.endsWith('.png') || pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) {
    return false;
  }
  return true;
}

function shouldAttachCsp(request: NextRequest, response: NextResponse) {
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('text/html') || accept.includes('application/xhtml+xml')) {
    return true;
  }
  const contentType = response.headers.get('content-type') ?? '';
  return contentType.includes('text/html');
}

function buildPermissionsPolicy() {
  return [
    'accelerometer=()',
    'autoplay=()',
    'camera=()',
    'clipboard-read=()',
    'clipboard-write=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'fullscreen=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'midi=()',
    'payment=()',
    'screen-wake-lock=()',
    'sync-xhr=()',
    'usb=()',
    'xr-spatial-tracking=()',
    // Keep both legacy FLoC and modern Topics API opt-outs; unknown directives are ignored so this redundancy is safe.
    'interest-cohort=()',
    'browsing-topics=()',
  ].join(', ');
}

function getHostname(request: NextRequest) {
  const hostHeader = request.headers.get('host');
  if (hostHeader) {
    return hostHeader.split(':')[0]?.toLowerCase() ?? '';
  }
  return request.nextUrl.hostname?.toLowerCase() ?? '';
}

function isLoopbackHost(hostname: string | null | undefined) {
  if (!hostname) {
    return false;
  }
  const normalized = hostname.toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '[::1]' || normalized === '::1';
}

function isLoopbackOriginValue(value: string | null | undefined) {
  if (!value) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return isLoopbackHost(parsed.hostname);
  } catch {
    return false;
  }
}

function shouldBypassLocalization(pathname: string) {
  const normalised = pathname.toLowerCase();
  if (normalised.startsWith('/_next') || normalised.startsWith('/api')) {
    return true;
  }
  for (const prefix of STATIC_PATH_PREFIXES) {
    if (normalised.startsWith(prefix)) {
      return true;
    }
  }
  if (STATIC_PATH_EXACT.has(normalised)) {
    return true;
  }
  const lastSegment = normalised.split('/').pop() ?? '';
  if (EXTENSION_PATTERN.test(lastSegment)) {
    return true;
  }
  return false;
}

function normalizeAppLocale(locale: string | null | undefined): AppLocale {
  if (!locale) {
    return DEFAULT_LOCALE.value;
  }
  const lower = locale.toLowerCase();
  if (SUPPORTED_LOCALE_VALUES.has(lower)) {
    return lower as AppLocale;
  }
  const mapped = SHORT_TO_FULL[lower];
  if (mapped) {
    return mapped;
  }
  return DEFAULT_LOCALE.value;
}

const ENV_DEFAULT_LOCALE = normalizeAppLocale(
  process.env.DEFAULT_LOCALE ?? process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? DEFAULT_LOCALE.value
);

function resolvePreferredLocale(
  request: NextRequest,
  options: { forceDefault?: boolean } = {}
): AppLocale {
  if (options.forceDefault) {
    return ENV_DEFAULT_LOCALE;
  }
  const cookieHeader = request.headers.get('cookie');
  const cookieLocale = extractLocaleFromCookies(cookieHeader);
  if (cookieLocale) {
    return normalizeAppLocale(cookieLocale);
  }

  const headerLocale = resolveLocaleFromAcceptLanguage(request.headers.get('accept-language'));
  if (headerLocale) {
    return headerLocale;
  }

  return ENV_DEFAULT_LOCALE;
}

function buildRedirectUrl(request: NextRequest, locale: AppLocale) {
  const url = request.nextUrl.clone();
  const pathname = request.nextUrl.pathname || '/';
  url.pathname = buildPathForLocale(locale, pathname);
  return url;
}

function applyLocaleCookies(response: NextResponse, locale: AppLocale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: COOKIE_PATH,
    sameSite: COOKIE_SAME_SITE,
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });
  response.cookies.set(NEXT_LOCALE_COOKIE, locale, {
    path: COOKIE_PATH,
    sameSite: COOKIE_SAME_SITE,
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });
}

function applySecurityHeaders(request: NextRequest, response: NextResponse, nonce: string) {
  if (!shouldApplySecurityHeaders(request)) {
    return response;
  }

  const flags = getFlags({ request });
  const enforceCsp = !flags.SECURITY_REPORT_ONLY;
  const isProdLike = isProduction();
  const isDev = !isProdLike;
  const hostname = request.nextUrl.hostname;
  const isLocalhost = isLoopbackHost(hostname);

  const shouldSetCsp = shouldAttachCsp(request, response);
  if (shouldSetCsp) {
    const csp = buildCsp({ nonce, isDev });
    const headerName = enforceCsp ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
    response.headers.set(headerName, csp);
    if (!enforceCsp) {
      response.headers.delete('Content-Security-Policy');
    }
    response.headers.set('x-csp-nonce', nonce);
  }

  if (isProdLike && !isLocalhost) {
    response.headers.set(
      'Strict-Transport-Security',
      `max-age=${HSTS_MAX_AGE_SECONDS}; includeSubDomains; preload`
    );
  } else {
    response.headers.delete('Strict-Transport-Security');
  }
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', buildPermissionsPolicy());
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');

  return response;
}

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  request.headers.set('x-csp-nonce', nonce);

  const hostname = getHostname(request);
  const isLocalhost = isLoopbackHost(hostname);
  const shouldAllowIndex = allowIndexOverride || isLocalhost;
  if (shouldAllowIndex) {
    request.headers.set('x-allow-robots', 'true');
  }

  const baseUrlIsLoopback = isLoopbackOriginValue(process.env.BASE_URL);
  const forceDefaultLocale = isLocalhost || baseUrlIsLoopback;
  const localeRedirectCookie = request.cookies.get(LOCALE_REDIRECT_COOKIE);
  const hasLocaleRedirectCookie = localeRedirectCookie?.value === '1';

  const { pathname } = request.nextUrl;

  if (shouldBypassLocalization(pathname)) {
    const response = NextResponse.next();
    return applySecurityHeaders(request, response, nonce);
  }

  const localizedMatch = pathname.match(ALREADY_LOCALIZED);
  if (localizedMatch) {
    const locale = localizedMatch[1]?.toLowerCase() ?? '';
    if (SUPPORTED_LOCALE_VALUES.has(locale)) {
      const localizedResponse =
        forceDefaultLocale && locale === ENV_DEFAULT_LOCALE ? NextResponse.next() : intlMiddleware(request);
      applyLocaleCookies(localizedResponse, locale as AppLocale);
      if (shouldAllowIndex) {
        localizedResponse.headers.set('x-robots-tag', 'index, follow');
      }
      return applySecurityHeaders(request, localizedResponse, nonce);
    }
  }

  const shortMatch = pathname.match(SHORT_LOCALE_SEGMENT);
  if (shortMatch) {
    const shortLocale = shortMatch[1]?.toLowerCase() ?? '';
    const canonical = SHORT_TO_FULL[shortLocale];
    if (canonical) {
      const url = request.nextUrl.clone();
      const remainder = pathname.slice(shortMatch[0].length) || '/';
      url.pathname = `/${canonical}${remainder.startsWith('/') ? remainder : `/${remainder}`}`;
      const response = NextResponse.redirect(url, 308);
      if (shouldAllowIndex) {
        response.headers.set('x-robots-tag', 'index, follow');
      }
      return response;
    }
  }

  const targetLocale = resolvePreferredLocale(request, { forceDefault: forceDefaultLocale });
  const redirectUrl = buildRedirectUrl(request, targetLocale);

  if (pathname === '/' && hasLocaleRedirectCookie) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = redirectUrl.pathname;
    const rewriteResponse = NextResponse.rewrite(rewriteUrl);
    applyLocaleCookies(rewriteResponse, targetLocale);
    if (shouldAllowIndex) {
      rewriteResponse.headers.set('x-robots-tag', 'index, follow');
    }
    return applySecurityHeaders(request, rewriteResponse, nonce);
  }

  const response = NextResponse.redirect(redirectUrl, 308);
  if (pathname === '/') {
    response.cookies.set(LOCALE_REDIRECT_COOKIE, '1', {
      path: '/',
      maxAge: LOCALE_REDIRECT_MAX_AGE,
      sameSite: COOKIE_SAME_SITE,
    });
  }
  applyLocaleCookies(response, targetLocale);
  if (shouldAllowIndex) {
    response.headers.set('x-robots-tag', 'index, follow');
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)',
  ],
};
