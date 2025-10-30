import { expect, test } from '@tests/fixtures/playwright';

function getDirective(header: string, name: string): string | null {
  const pattern = new RegExp(`${name}\\s+([^;]+)`, 'i');
  const match = header.match(pattern);
  return match ? match[1].trim() : null;
}

function extractScriptNonce(header: string) {
  const directive = getDirective(header, 'script-src');
  if (!directive) return null;
  const sources = directive.split(/\s+/);
  const nonceSource = sources.find((source) => source.startsWith("'nonce-"));
  return nonceSource ? nonceSource.replace(/^'nonce-/, '').replace(/'$/, '') : null;
}

function containsUnsafeInline(header: string) {
  const directive = getDirective(header, 'script-src');
  if (!directive) return false;
  return directive.includes("'unsafe-inline'");
}

test.describe('Security headers', () => {
  test('HTML response advertises strict headers and a nonced CSP @smoke', async ({ page }) => {
    const navigationResponse = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(navigationResponse, 'Expected a navigation response for the HTML page').toBeTruthy();
    // Always inspect the navigation response so we validate the exact HTML payload after redirects/caching.
    const headers = navigationResponse!.headers();
    await test.info().attach('security-headers.json', {
      body: JSON.stringify(headers, null, 2),
      contentType: 'application/json',
    });

    const hstsHeader = headers['strict-transport-security'];
    const canonicalProd =
      process.env.VERCEL_ENV === 'production' ||
      (process.env.VERCEL_ENV === undefined && process.env.NODE_ENV === 'production');
    const canonicalHostEnv =
      process.env.CANONICAL_HOST ??
      process.env.NEXT_PUBLIC_CANONICAL_HOST ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.APP_BASE_URL ??
      null;
    let canonicalHost: string | null = null;
    if (canonicalHostEnv) {
      try {
        canonicalHost = new URL(canonicalHostEnv).host || null;
      } catch {
        // ignore parse errors; fall back to null
        canonicalHost = null;
      }
    }
    const navigationUrl = navigationResponse?.url() ? new URL(navigationResponse.url()) : null;
    const currentHost = navigationUrl?.host ?? null;
    const isHttpsRequest = navigationUrl?.protocol === 'https:';
    const isPrelaunch = ['1', 'true', 'yes', 'on'].includes(
      (process.env.IS_PRELAUNCH ?? '').toLowerCase()
    );
    const enforceFullHsts =
      canonicalProd &&
      !isPrelaunch &&
      isHttpsRequest &&
      canonicalHost !== null &&
      currentHost === canonicalHost;

    if (enforceFullHsts) {
      expect(hstsHeader, 'HSTS must be present in production').toBeTruthy();
    }

    if (hstsHeader) {
      const maxAgeMatch = hstsHeader.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? Number.parseInt(maxAgeMatch[1], 10) : Number.NaN;
      expect(Number.isNaN(maxAge)).toBeFalsy();
      const minimumMaxAge = enforceFullHsts ? 31536000 : 86400;
      expect(maxAge).toBeGreaterThanOrEqual(minimumMaxAge);
      if (enforceFullHsts) {
        // Preview/CDN layers may rewrite HSTS; only enforce includeSubDomains/preload on the canonical production host.
        const normalizedHsts = hstsHeader.toLowerCase();
        expect(normalizedHsts).toContain('includesubdomains');
        expect(normalizedHsts).toContain('preload');
      }
    } else {
      expect(enforceFullHsts).toBeFalsy();
    }

    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-content-type-options']).toBe('nosniff');
    const permissionsPolicy = (headers['permissions-policy'] ?? '').toLowerCase();
    expect(permissionsPolicy).toContain('camera=()');
    const hasInterestCohort = permissionsPolicy.includes('interest-cohort=()');
    const hasBrowsingTopics = permissionsPolicy.includes('browsing-topics=()');
    expect(hasInterestCohort || hasBrowsingTopics).toBeTruthy(); // accept both legacy FLoC and modern Topics API opt-outs
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(headers['cross-origin-resource-policy']).toBe('same-site');
    expect(headers['cross-origin-embedder-policy']).toBe('require-corp');

    const rawMode = (process.env.CSP_MODE ?? '').toLowerCase();
    const cspMode = rawMode === 'strict' ? 'strict' : rawMode === 'off' ? 'off' : 'report-only';
    test.skip(cspMode === 'off', 'CSP_MODE=off disables enforcement; skip header assertions during debugging.');

    const enforcedHeader = headers['content-security-policy'];
    const reportOnlyHeader = headers['content-security-policy-report-only'];
    if (cspMode === 'strict') {
      expect(enforcedHeader, 'Expected Content-Security-Policy header when CSP_MODE=strict').toBeTruthy();
      expect(reportOnlyHeader, 'Report-Only header should be absent when enforcing').toBeFalsy();
    } else {
      expect(reportOnlyHeader, 'Expected Content-Security-Policy-Report-Only header when CSP_MODE=report-only').toBeTruthy();
      expect(enforcedHeader, 'Enforced CSP header should be absent in report-only mode').toBeFalsy();
    }

    const cspHeader = cspMode === 'strict' ? enforcedHeader! : reportOnlyHeader!;
    expect(cspHeader).toContain("default-src 'self'");
    expect(containsUnsafeInline(cspHeader)).toBeFalsy();

    const scriptSources = (getDirective(cspHeader, 'script-src') ?? '').split(/\s+/).filter(Boolean);
    expect(scriptSources.some((source) => source.replace(/'/g, '') === 'strict-dynamic')).toBeTruthy();
    expect(scriptSources).toContain('https:');
    if (cspMode === 'strict') {
      expect(scriptSources).toContain('http:');
      expect(scriptSources).not.toContain("'self'");
    } else {
      expect(scriptSources).toContain("'self'");
    }
    const nonce = extractScriptNonce(cspHeader);
    expect(nonce).toBeTruthy();
    expect(headers['x-csp-nonce']).toBeTruthy();
    expect(nonce).toBe(headers['x-csp-nonce']);

    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
      expect(scriptSources).not.toContain("'unsafe-eval'");
    }

    const allInlineScriptsHaveNonce = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLScriptElement>('script:not([src])')).every(
        (node) => typeof node.nonce === 'string' && node.nonce.length > 0
      )
    );
    expect(allInlineScriptsHaveNonce).toBeTruthy();

    const jsonLdNoncesMatch = await page.evaluate(() => {
      const nonces = Array.from(
        document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')
      ).map((node) => node.nonce);
      if (nonces.length === 0) return false;
      return nonces.every((value) => value && value.length > 0) && new Set(nonces).size === 1;
    });
    expect(jsonLdNoncesMatch).toBeTruthy();

    const reportUriDirective = getDirective(cspHeader, 'report-uri');
    expect(reportUriDirective).toBeTruthy();
    expect(reportUriDirective).toContain('/api/security/csp-report');

    const reportToDirective = getDirective(cspHeader, 'report-to');
    expect(reportToDirective).toBeTruthy();
    expect(reportToDirective).toContain('csp-endpoint');

    const objectSrcDirective = getDirective(cspHeader, 'object-src');
    expect(objectSrcDirective).toBeTruthy();
    if (objectSrcDirective) {
      expect(objectSrcDirective.split(/\s+/)).toContain("'none'");
    }
    const baseUriDirective = getDirective(cspHeader, 'base-uri');
    expect(baseUriDirective).toBeTruthy();
    if (baseUriDirective) {
      expect(baseUriDirective.split(/\s+/)).toContain("'self'");
    }
    const formActionDirective = getDirective(cspHeader, 'form-action');
    expect(formActionDirective).toBeTruthy();
    if (formActionDirective) {
      expect(formActionDirective.split(/\s+/)).toContain("'self'");
    }

    const reportToHeader = headers['report-to'];
    expect(reportToHeader, 'Report-To header should propagate CSP reporting endpoint').toBeTruthy();
    if (reportToHeader) {
      let parsed: { group?: string; endpoints?: Array<{ url?: string }> } | null = null;
      expect(() => {
        parsed = JSON.parse(reportToHeader);
      }).not.toThrow();
      expect(parsed?.group).toBe('csp-endpoint');
      const firstEndpoint = parsed?.endpoints?.[0]?.url ?? '';
      expect(firstEndpoint).toContain('/api/security/csp-report');
    }

    const inlineScriptExecuted = await page.evaluate(() => {
      delete (window as Window & { __cspInlineTest?: boolean }).__cspInlineTest;
      const script = document.createElement('script');
      script.textContent = 'window.__cspInlineTest = true;';
      document.body.appendChild(script);
      return Boolean((window as Window & { __cspInlineTest?: boolean }).__cspInlineTest);
    });
    if (cspMode === 'strict') {
      expect(inlineScriptExecuted).toBeFalsy();
    } else {
      expect(inlineScriptExecuted).toBeTruthy();
    }
  });
});
