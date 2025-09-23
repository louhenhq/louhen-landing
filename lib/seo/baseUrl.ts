import { headers } from 'next/headers';

/**
 * Resolve the base URL for absolute metadata links, preferring env overrides
 * but falling back to request headers so previews/local dev stay accurate.
 */
export async function resolveBaseUrl(): Promise<string> {
  const explicit = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  try {
    const requestHeaders = await headers();
    const proto = requestHeaders.get('x-forwarded-proto') || 'http';
    const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host');
    if (host) {
      return `${proto}://${host}`.replace(/\/$/, '');
    }
  } catch {
    // Called outside a request scope (e.g., unit tests). Fall back below.
  }

  return 'http://localhost:3000';
}
