const CANONICAL_ORIGIN = 'https://www.louhen.app';
const PREVIEW_FALLBACK_ORIGIN = 'https://staging.louhen.app';

function normalizeOrigin(raw: string): string {
  return raw.replace(/\/+$/, '');
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

  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv && vercelEnv !== 'production') {
    return PREVIEW_FALLBACK_ORIGIN;
  }

  return CANONICAL_ORIGIN;
}
