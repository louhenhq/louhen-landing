import type { CspMode } from './csp';

export type BuildSecurityHeadersOptions = {
  cspHeader:
    | {
        name: string;
        value: string;
        reportEndpoint: string;
        reportGroup?: string;
      }
    | null;
  nonce: string;
  mode: CspMode;
  isProductionLike: boolean;
  isLoopbackHost: boolean;
};

const HSTS_MAX_AGE_SECONDS = 31_536_000; // 1 year
const DEFAULT_REPORT_GROUP = 'csp-endpoint';

export function buildPermissionsPolicy(): string {
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
    'interest-cohort=()',
    'browsing-topics=()',
  ].join(', ');
}

function buildReportToHeader(endpoint: string, group: string) {
  return JSON.stringify({
    group,
    max_age: 10_886_400, // 18 weeks
    include_subdomains: true,
    endpoints: [{ url: endpoint }],
  });
}

export function buildSecurityHeaders(options: BuildSecurityHeadersOptions): Record<string, string> {
  const {
    cspHeader,
    nonce,
    mode,
    isLoopbackHost,
    isProductionLike,
  } = options;

  const headers: Record<string, string> = {};
  headers['x-csp-nonce'] = nonce;

  if (cspHeader) {
    headers[cspHeader.name] = cspHeader.value;
    const group = cspHeader.reportGroup ?? DEFAULT_REPORT_GROUP;
    headers['Report-To'] = buildReportToHeader(cspHeader.reportEndpoint, group);
  } else {
    delete headers['Content-Security-Policy'];
    delete headers['Content-Security-Policy-Report-Only'];
    delete headers['Report-To'];
  }

  if (mode === 'strict') {
    delete headers['Content-Security-Policy-Report-Only'];
  } else if (mode === 'report-only') {
    delete headers['Content-Security-Policy'];
  }

  if (isProductionLike && !isLoopbackHost) {
    headers['Strict-Transport-Security'] = `max-age=${HSTS_MAX_AGE_SECONDS}; includeSubDomains; preload`;
  }

  headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-Frame-Options'] = 'DENY';
  headers['Permissions-Policy'] = buildPermissionsPolicy();
  headers['Cross-Origin-Opener-Policy'] = 'same-origin';
  headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
  headers['Cross-Origin-Resource-Policy'] = 'same-site';

  return headers;
}
