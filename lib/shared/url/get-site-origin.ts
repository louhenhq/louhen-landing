const CANONICAL_ORIGIN = 'https://www.louhen.app';
const PREVIEW_FALLBACK_ORIGIN = 'https://staging.louhen.app';
const LOOPBACK_HOST = '127.0.0.1';

function normalizeLoopbackHost(hostname: string): string {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower === '0.0.0.0' || lower === '::1' || lower === '[::1]') {
    return LOOPBACK_HOST;
  }
  return hostname;
}

function normalizeOrigin(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  const normalise = (value: string) => {
    const url = new URL(value);
    url.hostname = normalizeLoopbackHost(url.hostname);
    return url.origin;
  };

  try {
    return normalise(trimmed);
  } catch {
    try {
      return normalise(`http://${trimmed}`);
    } catch {
      return trimmed.replace(/\/+$/, '');
    }
  }
}

/**
 * Returns the absolute site origin without a trailing slash.
 * Prioritises PREVIEW_BASE_URL (remote Playwright), then App/Next public overrides,
 * before falling back to the canonical production host.
 */
export function getSiteOrigin(): string {
  const previewBase = process.env.PREVIEW_BASE_URL?.trim();
  if (previewBase) {
    return normalizeOrigin(previewBase);
  }

  const appBase = process.env.APP_BASE_URL?.trim();
  if (appBase) {
    return normalizeOrigin(appBase);
  }

  const publicSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (publicSite) {
    return normalizeOrigin(publicSite);
  }

  const canonicalHost = process.env.CANONICAL_HOST?.trim();
  if (canonicalHost) {
    const origin = canonicalHost.includes('://') ? canonicalHost : `https://${canonicalHost}`;
    return normalizeOrigin(origin);
  }

  const publicCanonical = process.env.NEXT_PUBLIC_CANONICAL_HOST?.trim();
  if (publicCanonical) {
    const origin = publicCanonical.includes('://') ? publicCanonical : `https://${publicCanonical}`;
    return normalizeOrigin(origin);
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv && vercelEnv !== 'production') {
    return PREVIEW_FALLBACK_ORIGIN;
  }

  return CANONICAL_ORIGIN;
}
