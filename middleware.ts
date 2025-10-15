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
import { isProduction } from '@/lib/shared/flags';
import { buildCspHeader, resolveCspMode } from '@/lib/security/csp';
import { buildSecurityHeaders } from '@/lib/security/headers';
import { COOKIE_PATH, COOKIE_SAME_SITE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from '@/lib/theme/constants';

const COOKIE_SAME_SITE_RESPONSE = COOKIE_SAME_SITE.toLowerCase() as 'lax' | 'strict' | 'none';
const ROUTE_LOCALE_HEADER = 'x-route-locale';

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

function generateNonce() {
  return crypto.randomUUID().replace(/-/g, '');
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

const LOOPBACK_CANONICAL_HOST = '127.0.0.1';

function normalizeLoopbackUrl(url: URL) {
  if (isLoopbackHost(url.hostname)) {
    const port = url.port;
    url.hostname = LOOPBACK_CANONICAL_HOST;
    url.host = port ? `${LOOPBACK_CANONICAL_HOST}:${port}` : LOOPBACK_CANONICAL_HOST;
  }
}

function cloneRequestUrl(request: NextRequest): URL {
  return new URL(request.url);
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
  const url = cloneRequestUrl(request);
  const pathname = request.nextUrl.pathname || '/';
  url.pathname = buildPathForLocale(locale, pathname);
  normalizeLoopbackUrl(url);
  return url;
}

function applyLocaleCookies(response: NextResponse, locale: AppLocale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: COOKIE_PATH,
    sameSite: COOKIE_SAME_SITE_RESPONSE,
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });
  response.cookies.set(NEXT_LOCALE_COOKIE, locale, {
    path: COOKIE_PATH,
    sameSite: COOKIE_SAME_SITE_RESPONSE,
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });
}

function applySecurityHeaders(request: NextRequest, response: NextResponse, nonce: string) {
  if (!shouldApplySecurityHeaders(request)) {
    return response;
  }

  const mode = resolveCspMode();
  const isProdLike = isProduction();
  const hostname = request.nextUrl.hostname;
  const isLocalhost = isLoopbackHost(hostname);
  const allowDevSources = !isProdLike || isLocalhost;
  const attachCsp = shouldAttachCsp(request, response) && mode !== 'off';
  const requestUrl = cloneRequestUrl(request);

  const cspHeader = attachCsp
    ? buildCspHeader({
        nonce,
        mode,
        requestUrl,
        allowDevSources,
      })
    : null;

  const headers = buildSecurityHeaders({
    cspHeader,
    nonce,
    mode,
    isProductionLike: isProdLike,
    isLoopbackHost: isLocalhost,
  });

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  if (!cspHeader) {
    response.headers.delete('Content-Security-Policy');
    response.headers.delete('Content-Security-Policy-Report-Only');
    response.headers.delete('Report-To');
  }

  if (cspHeader) {
    const headerName = cspHeader.name.toLowerCase();
    request.headers.set(headerName, cspHeader.value);
    const opposite =
      cspHeader.name === 'Content-Security-Policy'
        ? 'content-security-policy-report-only'
        : 'content-security-policy';
    request.headers.delete(opposite);
  } else {
    request.headers.delete('content-security-policy');
    request.headers.delete('content-security-policy-report-only');
  }

  return response;
}

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  request.headers.set('x-csp-nonce', nonce);
  request.headers.delete(ROUTE_LOCALE_HEADER);

  const hostname = getHostname(request);
  const isLocalhost = isLoopbackHost(hostname);
  if (isLocalhost) {
    const port = request.nextUrl.port;
    const forwardedHost = port ? `${LOOPBACK_CANONICAL_HOST}:${port}` : LOOPBACK_CANONICAL_HOST;
    request.headers.set('x-forwarded-host', forwardedHost);
  }
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
    const matchedLocale = localizedMatch[1] ?? '';
    const normalizedLocale = matchedLocale.toLowerCase();
    if (SUPPORTED_LOCALE_VALUES.has(normalizedLocale)) {
      request.headers.set(ROUTE_LOCALE_HEADER, normalizedLocale);
      if (matchedLocale !== normalizedLocale) {
        const normalizedUrl = cloneRequestUrl(request);
        const remainder = pathname.slice(localizedMatch[0].length);
        const suffix = remainder.length ? remainder : '';
        normalizedUrl.pathname = `/${normalizedLocale}${suffix}`;
        normalizeLoopbackUrl(normalizedUrl);
        const redirectResponse = NextResponse.redirect(normalizedUrl, 308);
        redirectResponse.headers.set(ROUTE_LOCALE_HEADER, normalizedLocale);
        if (shouldAllowIndex) {
          redirectResponse.headers.set('x-robots-tag', 'index, follow');
        }
        return applySecurityHeaders(request, redirectResponse, nonce);
      }
      const shouldSkipIntl = isLocalhost;
      const localizedResponse =
        forceDefaultLocale && normalizedLocale === ENV_DEFAULT_LOCALE
          ? NextResponse.next()
          : shouldSkipIntl
            ? NextResponse.next()
            : intlMiddleware(request);
      if (!shouldSkipIntl && isLocalhost) {
        const rewriteTarget = localizedResponse.headers.get('x-middleware-rewrite');
        if (rewriteTarget && rewriteTarget.includes('://localhost')) {
          const adjusted = rewriteTarget.replace('://localhost', `://${LOOPBACK_CANONICAL_HOST}`);
          localizedResponse.headers.delete('x-middleware-rewrite');
          localizedResponse.headers.set('x-middleware-rewrite', adjusted);
        }
      }
      localizedResponse.headers.set(ROUTE_LOCALE_HEADER, normalizedLocale);
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
      const url = new URL(request.url);
      const remainder = pathname.slice(shortMatch[0].length) || '/';
      url.pathname = `/${canonical}${remainder.startsWith('/') ? remainder : `/${remainder}`}`;
      normalizeLoopbackUrl(url);
      const response = NextResponse.redirect(url, 308);
      if (shouldAllowIndex) {
        response.headers.set('x-robots-tag', 'index, follow');
      }
      return response;
    }
  }

  if (pathname !== '/') {
    const nextResponse = NextResponse.next();
    return applySecurityHeaders(request, nextResponse, nonce);
  }

  const targetLocale = resolvePreferredLocale(request, { forceDefault: forceDefaultLocale });
  const redirectUrl = buildRedirectUrl(request, targetLocale);

  if (hasLocaleRedirectCookie) {
    const rewriteUrl = cloneRequestUrl(request);
    rewriteUrl.pathname = redirectUrl.pathname;
    normalizeLoopbackUrl(rewriteUrl);
    const rewriteResponse = NextResponse.rewrite(rewriteUrl);
    if (isLocalhost) {
      rewriteResponse.headers.delete('x-middleware-rewrite');
      rewriteResponse.headers.set('x-middleware-rewrite', rewriteUrl.toString());
    }
    applyLocaleCookies(rewriteResponse, targetLocale);
    if (shouldAllowIndex) {
      rewriteResponse.headers.set('x-robots-tag', 'index, follow');
    }
    return applySecurityHeaders(request, rewriteResponse, nonce);
  }

  const response = NextResponse.redirect(redirectUrl, 308);
  response.cookies.set(LOCALE_REDIRECT_COOKIE, '1', {
    path: '/',
    maxAge: LOCALE_REDIRECT_MAX_AGE,
    sameSite: COOKIE_SAME_SITE_RESPONSE,
  });
  applyLocaleCookies(response, targetLocale);
  if (shouldAllowIndex) {
    response.headers.set('x-robots-tag', 'index, follow');
  }
  return applySecurityHeaders(request, response, nonce);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|icon.svg).*)',
  ],
};
