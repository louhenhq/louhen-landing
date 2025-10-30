export type CspMode = 'strict' | 'report-only' | 'off';

export type BuildCspOptions = {
  nonce: string;
  requestUrl: URL;
  mode: CspMode;
  allowDevSources?: boolean;
  reportUri?: string;
  reportToGroup?: string;
  connectSources?: string[];
  styleSources?: string[];
};

const MODE_VALUES: ReadonlySet<CspMode> = new Set(['strict', 'report-only', 'off']);
const DEFAULT_REPORT_GROUP = 'csp-endpoint';
const DEFAULT_REPORT_URI = '/api/security/csp-report';

function sanitizeNonce(value: string): string {
  if (!value || typeof value !== 'string') {
    throw new Error('CSP nonce must be a non-empty string.');
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('CSP nonce must not be blank.');
  }
  if (!/^[A-Za-z0-9+/=_-]+$/.test(trimmed)) {
    throw new Error('CSP nonce contains invalid characters.');
  }
  return trimmed;
}

function createDirectiveMap(): Map<string, Set<string>> {
  return new Map<string, Set<string>>();
}

function addDirectiveValue(map: Map<string, Set<string>>, directive: string, value: string) {
  if (!map.has(directive)) {
    map.set(directive, new Set());
  }
  map.get(directive)!.add(value);
}

export function normalizeCspMode(raw: string | null | undefined): CspMode | null {
  if (!raw) {
    return null;
  }
  const candidate = raw.trim().toLowerCase();
  if (MODE_VALUES.has(candidate as CspMode)) {
    return candidate as CspMode;
  }
  return null;
}

export function resolveCspMode(): CspMode {
  const explicit = normalizeCspMode(process.env.CSP_MODE);
  if (explicit) {
    return explicit;
  }
  const vercelEnv = process.env.VERCEL_ENV?.toLowerCase();
  if (vercelEnv === 'production') {
    return 'strict';
  }
  if (vercelEnv === 'preview' || vercelEnv === 'development') {
    return 'report-only';
  }
  if (process.env.NODE_ENV === 'production') {
    return 'strict';
  }
  return 'report-only';
}

function resolveConnectSources(options: BuildCspOptions): Set<string> {
  const values = new Set<string>(["'self'", 'https:']);
  if (Array.isArray(options.connectSources)) {
    for (const value of options.connectSources) {
      if (value && value.trim()) {
        values.add(value.trim());
      }
    }
  }
  if (options.allowDevSources) {
    values.add('ws:');
    values.add('wss:');
    values.add('http://localhost:*');
    values.add('https://localhost:*');
    values.add('http://127.0.0.1:*');
    values.add('https://127.0.0.1:*');
  }
  return values;
}

export function buildCspHeader(
  options: BuildCspOptions
): { name: string; value: string; reportEndpoint: string; reportGroup: string } | null {
  if (options.mode === 'off') {
    return null;
  }
  const nonce = sanitizeNonce(options.nonce);
  const directives = createDirectiveMap();

  addDirectiveValue(directives, 'default-src', "'self'");

  const scriptSources =
    options.mode === 'strict'
      ? new Set<string>([`'nonce-${nonce}'`, "'strict-dynamic'", 'https:', 'http:'])
      : new Set<string>(["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", 'https:']);
  directives.set('script-src', scriptSources);

  const styleSources = new Set(["'self'", "'unsafe-inline'", 'https:']);
  if (Array.isArray(options.styleSources)) {
    for (const source of options.styleSources) {
      if (source && source.trim()) {
        styleSources.add(source.trim());
      }
    }
  }

  directives.set('style-src', styleSources);

  addDirectiveValue(directives, 'img-src', "'self'");
  addDirectiveValue(directives, 'img-src', 'data:');
  addDirectiveValue(directives, 'img-src', 'https:');

  addDirectiveValue(directives, 'font-src', "'self'");
  addDirectiveValue(directives, 'font-src', 'https:');
  addDirectiveValue(directives, 'font-src', 'data:');

  directives.set('connect-src', resolveConnectSources(options));

  addDirectiveValue(directives, 'object-src', "'none'");
  addDirectiveValue(directives, 'base-uri', "'self'");
  addDirectiveValue(directives, 'form-action', "'self'");
  addDirectiveValue(directives, 'frame-ancestors', "'none'");

  const reportUri = options.reportUri ?? DEFAULT_REPORT_URI;
  const reportGroup = options.reportToGroup ?? DEFAULT_REPORT_GROUP;
  addDirectiveValue(directives, 'report-to', reportGroup);
  addDirectiveValue(directives, 'report-uri', reportUri);

  const serialized = Array.from(directives.entries())
    .map(([directive, values]) => `${directive} ${Array.from(values).join(' ')}`)
    .join('; ');

  const headerName =
    options.mode === 'strict' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';

  const reportEndpoint = new URL(reportUri, options.requestUrl).toString();

  return {
    name: headerName,
    value: serialized,
    reportEndpoint,
    reportGroup,
  };
}
