import { NextResponse, type NextRequest } from 'next/server';
import {
  DEFAULT_LOCALE,
  FULL_LOCALES,
  SHORT_TO_FULL,
  SUPPORTED_LOCALES,
} from './lib/i18n/locales';
import { LOCALE_COOKIE } from './lib/theme/constants';

const SUPPORTED_LOCALE_VALUES = new Set(FULL_LOCALES.map((value) => value.toLowerCase()));
const ALREADY_LOCALIZED = /^\/(en-de|de-de)(?:\/|$)/;
const allowIndexOverride = process.env.LH_ALLOW_INDEX === 'true';

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

function getHostname(request: NextRequest) {
  const hostHeader = request.headers.get('host');
  if (hostHeader) {
    return hostHeader.split(':')[0]?.toLowerCase() ?? '';
  }
  return request.nextUrl.hostname?.toLowerCase() ?? '';
}

function isLoopbackHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
}

function normalizeToSupported(value: string | undefined | null) {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (SUPPORTED_LOCALE_VALUES.has(normalized)) {
    return normalized;
  }
  const mapped = SHORT_TO_FULL[normalized];
  return mapped ?? null;
}

function mapLanguageToLocale(language: string | undefined | null) {
  if (!language) return null;
  const normalized = language.toLowerCase();
  return SUPPORTED_LOCALES.find((entry) => entry.language === normalized)?.value ?? null;
}

function resolvePreferredLocale(request: NextRequest) {
  const explicitLocale =
    normalizeToSupported(request.cookies.get(LOCALE_COOKIE)?.value) ||
    normalizeToSupported(request.cookies.get('NEXT_LOCALE')?.value);
  if (explicitLocale) {
    return explicitLocale;
  }

  const acceptLanguage = request.headers.get('accept-language') ?? '';
  if (acceptLanguage.length) {
    const tokens = acceptLanguage.split(',');
    for (const token of tokens) {
      const candidate = token.trim().split(';')[0];
      const resolved = normalizeToSupported(candidate) || mapLanguageToLocale(candidate.split('-')[0]);
      if (resolved) {
        return resolved;
      }
    }
  }

  return DEFAULT_LOCALE.value;
}

function buildRedirectUrl(request: NextRequest, targetLocale: string) {
  const url = request.nextUrl.clone();
  const pathname = request.nextUrl.pathname;
  const remainder = pathname === '/' ? '/' : pathname;
  url.pathname = `/${targetLocale}${remainder === '/' ? '/' : remainder}`;
  return url;
}

function applySecurityHeaders(response: NextResponse, nonce: string, isLocal: boolean) {
  response.headers.set('x-csp-nonce', nonce);

  if (isLocal) {
    return response;
  }

  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-Frame-Options', 'DENY');

  return response;
}

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  request.headers.set('x-csp-nonce', nonce);

  const pathname = request.nextUrl.pathname;
  const hostname = getHostname(request);
  const isLocalhost = isLoopbackHost(hostname);
  const shouldAllowIndex = allowIndexOverride || isLocalhost;

  if (shouldAllowIndex) {
    request.headers.set('x-allow-robots', 'true');
  }

  if (ALREADY_LOCALIZED.test(pathname)) {
    const response = NextResponse.next();

    if (shouldAllowIndex) {
      response.headers.set('x-robots-tag', 'index, follow');
    }

    if (!shouldHandleHtml(request)) {
      return response;
    }

    const csp = buildCsp(nonce);
    response.headers.set('Content-Security-Policy', csp);
    return applySecurityHeaders(response, nonce, isLocalhost);
  }

  const shortLocaleMatch = pathname.match(/^\/([A-Za-z]{2})(?=\/|$)/);
  if (shortLocaleMatch) {
    const shortLocale = shortLocaleMatch[1].toLowerCase();
    const canonical = SHORT_TO_FULL[shortLocale];
    if (canonical) {
      const url = request.nextUrl.clone();
      const remainder = pathname.slice(shortLocaleMatch[0].length) || '/';
      url.pathname = `/${canonical}${remainder.startsWith('/') ? remainder : `/${remainder}`}`;
      const response = NextResponse.redirect(url, 308);
      if (shouldAllowIndex) {
        response.headers.set('x-robots-tag', 'index, follow');
      }
      return response;
    }
  }

  const targetLocale = resolvePreferredLocale(request);
  const url = buildRedirectUrl(request, targetLocale);
  const response = NextResponse.redirect(url, 308);
  if (shouldAllowIndex) {
    response.headers.set('x-robots-tag', 'index, follow');
  }
  return response;
}

export const config = {
  matcher: ['/', '/(en|de)', '/(en|de)/:path*', '/(en-de|de-de)', '/(en-de|de-de)/:path*'],
};
