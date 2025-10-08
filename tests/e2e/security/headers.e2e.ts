import { expect, test } from '@playwright/test';
import { localeUrl } from '../_utils/url';

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
  test('HTML response advertises strict headers and a nonced CSP', async ({ page }) => {
    const homeUrl = localeUrl();
    const response = await page.request.get(homeUrl, {
      headers: { Accept: 'text/html' },
    });
    const headers = response.headers();

    const hstsHeader = headers['strict-transport-security'];
    const shouldHaveHsts =
      process.env.VERCEL_ENV === 'production' ||
      (process.env.VERCEL_ENV === undefined && process.env.NODE_ENV === 'production');
    if (shouldHaveHsts) {
      expect(hstsHeader, 'HSTS must be present in production').toBeTruthy();
      const maxAgeMatch = hstsHeader?.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? Number.parseInt(maxAgeMatch[1], 10) : NaN;
      expect(Number.isNaN(maxAge)).toBeFalsy();
      expect(maxAge, 'HSTS max-age must be at least one year').toBeGreaterThanOrEqual(31536000); // enforce minimum duration so stronger policies still pass
      expect(hstsHeader).toContain('includeSubDomains');
      expect(hstsHeader).toContain('preload');
    } else {
      expect(hstsHeader ?? '').toBe('');
    }

    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-content-type-options']).toBe('nosniff');
    const permissionsPolicy = headers['permissions-policy'] ?? '';
    expect(permissionsPolicy).toContain('camera=()');
    const hasInterestCohort = permissionsPolicy.includes('interest-cohort=()');
    const hasBrowsingTopics = permissionsPolicy.includes('browsing-topics=()');
    expect(hasInterestCohort || hasBrowsingTopics).toBeTruthy(); // accept both legacy FLoC and modern Topics API opt-outs
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(headers['cross-origin-resource-policy']).toBe('same-site');

    const cspHeader =
      headers['content-security-policy'] ?? headers['content-security-policy-report-only'];
    expect(cspHeader, 'CSP header must exist').toBeTruthy();
    expect(cspHeader).toContain("default-src 'self'");
    expect(containsUnsafeInline(cspHeader!)).toBeFalsy();

    const scriptSources = (getDirective(cspHeader!, 'script-src') ?? '').split(/\s+/);
    expect(scriptSources).toContain("'self'");
    const nonce = extractScriptNonce(cspHeader!);
    expect(nonce).toBeTruthy();
    expect(headers['x-csp-nonce']).toBeTruthy();
    expect(nonce).toBe(headers['x-csp-nonce']);

    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
      expect(scriptSources).not.toContain("'unsafe-eval'");
    }

    await page.goto(homeUrl);

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

    const inlineScriptExecuted = await page.evaluate(() => {
      delete (window as Window & { __cspInlineTest?: boolean }).__cspInlineTest;
      const script = document.createElement('script');
      script.textContent = 'window.__cspInlineTest = true;';
      document.body.appendChild(script);
      return Boolean((window as Window & { __cspInlineTest?: boolean }).__cspInlineTest);
    });
    expect(inlineScriptExecuted).toBeFalsy();
  });
});
