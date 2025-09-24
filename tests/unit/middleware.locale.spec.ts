import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { LOCALE_COOKIE, X_DEFAULT_LOCALE } from '@/next-intl.locales';

function buildRequest(
  path: string,
  {
    headers = {},
    cookies = {},
  }: {
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  } = {}
) {
  const url = new URL(path, 'https://example.com');
  const requestHeaders = new Headers({
    accept: 'text/html',
    ...headers,
  });
  const request = new NextRequest(url, { headers: requestHeaders });
  for (const [name, value] of Object.entries(cookies)) {
    request.cookies.set(name, value);
  }
  return request;
}

describe('middleware locale handling', () => {
  beforeEach(() => {
    // Ensure deterministic nonce for assertions involving headers.
    let counter = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => `nonce-${++counter}`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects humans on root to preferred locale and persists cookie', () => {
    const request = buildRequest('/', {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        'accept-language': 'en-DE,en;q=0.8',
        'x-vercel-ip-country': 'DE',
      },
    });

    const response = middleware(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://example.com/en-de');
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe('en-de');
    expect(response.headers.get('x-csp-nonce')).toBeDefined();
  });

  it('rewrites bots on root to x-default without redirect', () => {
    const request = buildRequest('/', {
      headers: {
        'user-agent': 'Googlebot',
      },
    });

    const response = middleware(request);

    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-rewrite')).toBe('https://example.com/en-eu');
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe(X_DEFAULT_LOCALE);
  });

  it('issues permanent redirect for legacy /de paths', () => {
    const request = buildRequest('/de/waitlist');
    const response = middleware(request);

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://example.com/de-de/waitlist');
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe('de-de');
  });

  it('passes through when locale prefix is present', () => {
    const request = buildRequest('/en-de/guides');
    const response = middleware(request);

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe('en-de');
  });

  it('rewrites non-localized paths to x-default, preserving remainder', () => {
    const request = buildRequest('/guides');
    const response = middleware(request);

    expect(response.headers.get('x-middleware-rewrite')).toBe('https://example.com/en-eu/guides');
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe('en-eu');
  });

  it('redirects root to cookie locale when available', () => {
    const request = buildRequest('/', {
      cookies: { [LOCALE_COOKIE]: 'fr-fr' },
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
    });

    const response = middleware(request);

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://example.com/fr-fr');
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe('fr-fr');
  });

  it('rewrites non-localized paths using cookie locale', () => {
    const request = buildRequest('/method', {
      cookies: { [LOCALE_COOKIE]: 'fr-fr' },
    });

    const response = middleware(request);

    expect(response.headers.get('x-middleware-rewrite')).toBe('https://example.com/fr-fr/method');
    expect(response.cookies.get(LOCALE_COOKIE)?.value).toBe('fr-fr');
  });

  it('applies vary headers for locale-sensitive responses', () => {
    const request = buildRequest('/', {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-vercel-ip-country': 'DE',
      },
    });

    const response = middleware(request);
    const vary = response.headers.get('Vary');
    expect(vary).toContain('Accept-Language');
    expect(vary).toContain('x-vercel-ip-country');
    expect(vary).toContain('Cookie');
    expect(vary).toContain('User-Agent');
  });
});
