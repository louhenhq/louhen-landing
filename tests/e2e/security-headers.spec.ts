import { expect, test } from '@playwright/test';
import { localeUrl } from './_utils/url';

function getCspNonce(header: string | undefined) {
  if (!header) return null;
  const match = header.match(/script-src[^;]*'nonce-([^'\s]+)'/);
  return match ? match[1] : null;
}

test.describe('Security headers', () => {
  test('HTTP response carries strict headers and CSP nonce', async ({ page }) => {
    const homeUrl = localeUrl();
    const response = await page.request.get(homeUrl, {
      headers: {
        Accept: 'text/html',
      },
    });
    const headers = response.headers();

    expect(headers['strict-transport-security']).toContain('max-age=63072000');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['x-frame-options']).toBe('DENY');

    const cspHeader = headers['content-security-policy'];
    expect(cspHeader).toBeDefined();
    expect(cspHeader).toContain("default-src 'self'");
    const nonce = getCspNonce(cspHeader);
    expect(nonce).toBeTruthy();

    await page.goto(homeUrl);

    const jsonLdHasNonce = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[type="application/ld+json"]')).every((node) => node.nonce && node.nonce.length > 0)
    );
    expect(jsonLdHasNonce).toBeTruthy();

    const inlineScriptExecuted = await page.evaluate(() => {
      delete (window as Window & { __cspInlineTest?: boolean }).__cspInlineTest;
      const script = document.createElement('script');
      script.textContent = 'window.__cspInlineTest = true;';
      document.body.appendChild(script);
      return typeof (window as Window & { __cspInlineTest?: boolean }).__cspInlineTest === 'boolean';
    });
    expect(inlineScriptExecuted).toBeFalsy();
  });
});
