import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { config as intlRoutingConfig } from './next-intl.config';

const intlMiddleware = createIntlMiddleware({
  ...intlRoutingConfig,
  localePrefix: 'as-needed',
});

const supportedLocales = new Set(intlRoutingConfig.locales);
const HSTS_MAX_AGE_SECONDS = 60 * 60 * 24 * 730; // 2 years
const REPORT_ONLY_ENV =
  process.env.NEXT_PUBLIC_CSP_REPORT_ONLY === '1' || process.env.CSP_REPORT_ONLY === '1';

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

function shouldRunIntl(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname || pathname === '') return true;
  if (pathname === '/') return true;
  if (pathname.startsWith('/_next')) return false;
  if (pathname.startsWith('/api')) return false;
  if (pathname.includes('.', 1)) return false;
  const [firstSegment] = pathname.split('/').filter(Boolean);
  if (!firstSegment) return true;
  return supportedLocales.has(firstSegment as (typeof intlRoutingConfig.locales)[number]);
}

function shouldApplySecurityHeaders(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/_next/static') || pathname.startsWith('/_next/image')) {
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

export function middleware(request: NextRequest) {
  const nonce = generateNonce();
  request.headers.set('x-csp-nonce', nonce);

  const isProdLike =
    process.env.VERCEL_ENV === 'production' ||
    (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production');
  const isDev = !isProdLike;
  const hostname = request.nextUrl.hostname;
  const isLocalhost =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';

  const response = shouldRunIntl(request)
    ? intlMiddleware(request)
    : NextResponse.next({
        request: {
          headers: request.headers,
        },
      });

  if (!shouldApplySecurityHeaders(request)) {
    return response;
  }

  const shouldSetCsp = shouldAttachCsp(request, response);

  if (shouldSetCsp) {
    const csp = buildCsp({ nonce, isDev });
    const enforceCsp = isProdLike || !REPORT_ONLY_ENV;
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

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)',
  ],
};
