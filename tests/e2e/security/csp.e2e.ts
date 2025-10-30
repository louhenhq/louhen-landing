import type { ConsoleMessage } from '@playwright/test';
import { expect, test } from '@tests/fixtures/playwright';
import { byTestId, testIds } from '@tests/e2e/_utils/selectors';
import { getDefaultLocale, localeUrl } from '@tests/e2e/_utils/url';

const defaultLocale = getDefaultLocale();
const fallbackLocale = defaultLocale === 'en-de' ? 'de-de' : 'en-de';
const locales = [defaultLocale, fallbackLocale];

function getDirective(header: string, name: string): string | null {
  const pattern = new RegExp(`${name}\\s+([^;]+)`, 'i');
  const match = header.match(pattern);
  return match ? match[1].trim() : null;
}

function containsUnsafeInline(header: string) {
  const directive = getDirective(header, 'script-src');
  if (!directive) return false;
  return directive.includes("'unsafe-inline'");
}

const INLINE_ATTRIBUTES = [
  'onclick',
  'onload',
  'onerror',
  'onchange',
  'onsubmit',
  'onfocus',
  'onblur',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onpointerdown',
  'onpointerup',
  'ontouchstart',
  'ontouchend',
] as const;

test.describe('@critical CSP integrity', () => {
  for (const locale of locales) {
    test(`enforces nonces and bans inline handlers (${locale}) @critical`, async ({ page }, testInfo) => {
      const consoleViolations: string[] = [];
      const consoleListener = (message: ConsoleMessage) => {
        const text = message.text();
        if (/content security policy|csp|violat/i.test(text)) {
          consoleViolations.push(text);
        }
      };
      page.on('console', consoleListener);

      const targetPath = localeUrl('/waitlist', { locale });
      const response = await page.goto(targetPath, { waitUntil: 'networkidle' });
      expect(response?.status(), `Expected 200 when loading ${targetPath}`).toBe(200);

      await expect(page.getByTestId(testIds.waitlist.card)).toBeVisible();
      await expect(page.locator(byTestId(testIds.sentinel.pageReady))).toHaveAttribute('data-state', 'ready');

      const headers = response!.headers();
      const nonceHeader = headers['x-csp-nonce'];
      expect(nonceHeader, 'x-csp-nonce header must be present').toBeTruthy();

      const enforcedHeader = headers['content-security-policy'];
      const reportOnlyHeader = headers['content-security-policy-report-only'];
      const cspHeader = enforcedHeader ?? reportOnlyHeader ?? '';
      expect(cspHeader, 'Expected at least one CSP header').toContain("default-src 'self'");
      expect(containsUnsafeInline(cspHeader)).toBeFalsy();
      expect(cspHeader.includes('strict-dynamic')).toBeTruthy();
      expect(cspHeader.includes(`'nonce-${nonceHeader}`)).toBeTruthy();

      const inlineHandlers = await page.evaluate((attributes: readonly string[]) => {
        const matches: Array<{ attribute: string; tag: string; id?: string | null; testid?: string | null }> = [];
        for (const attribute of attributes) {
          const nodes = document.querySelectorAll<HTMLElement>(`[${attribute}]`);
          nodes.forEach((node) => {
            matches.push({
              attribute,
              tag: node.tagName,
              id: node.id || null,
              testid: node.getAttribute('data-testid'),
            });
          });
        }
        return matches;
      }, INLINE_ATTRIBUTES);

      if (inlineHandlers.length > 0) {
        await testInfo.attach(`inline-handlers-${locale}.json`, {
          body: JSON.stringify(inlineHandlers, null, 2),
          contentType: 'application/json',
        });
      }
      expect(inlineHandlers, 'Inline event handlers must be removed under strict CSP').toHaveLength(0);

      const nonceSummary = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script'));
        const inlineScripts = scripts.filter((script) => !script.src);
        const inlineWithoutNonce = inlineScripts
          .filter((script) => !script.nonce || script.nonce.length === 0)
          .map((script) => ({
            type: script.type || 'default',
            snippet: script.textContent ? script.textContent.slice(0, 80) : '',
          }));
        const ldJson = Array.from(
          document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')
        ).map((script) => script.nonce ?? null);
        return {
          inlineCount: inlineScripts.length,
          inlineWithoutNonce,
          inlineNonces: inlineScripts.map((script) => script.nonce ?? null),
          ldJson,
        };
      });

      if (nonceSummary.inlineWithoutNonce.length > 0) {
        await testInfo.attach(`nonce-missing-${locale}.json`, {
          body: JSON.stringify(nonceSummary.inlineWithoutNonce, null, 2),
          contentType: 'application/json',
        });
      }

      expect(nonceSummary.inlineWithoutNonce, 'All inline scripts must declare a nonce').toHaveLength(0);
      const uniqueNonces = new Set(nonceSummary.inlineNonces.filter((value): value is string => Boolean(value)));
      expect(uniqueNonces.size, 'Inline scripts should share the request nonce').toBeLessThanOrEqual(1);
      if (nonceHeader) {
        expect(uniqueNonces.has(nonceHeader), 'Inline script nonces must match x-csp-nonce header').toBeTruthy();
      }

      const ldJsonNonces = nonceSummary.ldJson.filter((value): value is string => Boolean(value));
      expect(ldJsonNonces.length, 'Structured-data blocks must carry a nonce').toBeGreaterThan(0);
      if (nonceHeader) {
        expect(ldJsonNonces.every((value) => value === nonceHeader)).toBeTruthy();
      }

      if (consoleViolations.length > 0) {
        await testInfo.attach(`csp-console-${locale}.log`, {
          body: consoleViolations.join('\n'),
          contentType: 'text/plain',
        });
      }
      expect(consoleViolations, 'No CSP violations should appear in the console').toHaveLength(0);

      page.off('console', consoleListener);
    });
  }
});
