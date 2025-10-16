import { Buffer } from 'node:buffer';
import type { Route } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@tests/fixtures/playwright';
import { testIds, byTestId } from '@tests/e2e/_utils/selectors';
import { getDefaultLocale, localeUrl } from '@tests/e2e/_utils/url';
import { ALLOW_BLOCKED_REQUESTS_ANNOTATION } from '@tests/e2e/_utils/annotations';
import { WAITLIST_API_PATTERN, isWaitlistApiUrl } from '@tests/e2e/_utils/waitlistApi';

const defaultLocale = getDefaultLocale();

test.describe('@critical release gate', () => {
  test('home smoke renders primary navigation and CTA @critical', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    await expect(page.getByTestId(testIds.sentinel.pageReady)).toHaveAttribute('data-state', 'ready');
    await expect(page.getByTestId(testIds.nav.root)).toBeVisible();

    const heroCta = page.getByTestId(testIds.hero.primaryCta);
    await heroCta.scrollIntoViewIfNeeded();
    await expect(heroCta).toBeVisible();
    await expect(heroCta).toBeEnabled();
  });

  test('waitlist form submits successfully with mocked API @critical', async ({ page }) => {
    const waitlistResponse = {
      ok: true,
      id: 'mocked-waitlist',
    };

    const context = page.context();
    const waitlistHandler = async (route: Route) => {
      if (!isWaitlistApiUrl(route.request().url())) {
        if (typeof route.fallback === 'function') {
          await route.fallback();
        } else {
          await route.continue();
        }
        return;
      }
      if (route.request().method().toUpperCase() !== 'POST') {
        if (typeof route.fallback === 'function') {
          await route.fallback();
        } else {
          await route.continue();
        }
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(waitlistResponse),
      });
    };
    await context.route(WAITLIST_API_PATTERN, waitlistHandler);

    try {
      const consentDomains = ['127.0.0.1', 'localhost'];
      await page.context().addCookies(
        consentDomains.map((domain) => ({
          name: 'll_consent',
          value: 'v1:granted',
          domain,
          path: '/',
        }))
      );

      const response = await page.goto(localeUrl('/waitlist', { locale: defaultLocale }), { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);

      const email = page.getByTestId(testIds.waitlist.emailInput);
      await email.fill('critical-suite@example.com');

      const consent = page.getByTestId(testIds.waitlist.consentCheckbox);
      await consent.check({ force: true });

      const submit = page.getByTestId(testIds.waitlist.submitButton);
      await expect(submit).toBeEnabled();

      const [submissionResponse] = await Promise.all([
        page.waitForResponse((candidate) => {
          if (!isWaitlistApiUrl(candidate.url())) {
            return false;
          }
          return candidate.request().method().toUpperCase() === 'POST';
        }),
        submit.click(),
      ]);

      const submissionRequest = submissionResponse.request();
      expect(submissionRequest.method()).toBe('POST');
      expect(submissionResponse.ok()).toBeTruthy();

      await expect(page.getByTestId(testIds.waitlist.successState)).toBeVisible();
      await expect(page.locator(byTestId(testIds.waitlist.serverError))).toHaveCount(0);
    } finally {
      await context.unroute(WAITLIST_API_PATTERN);
    }
  });

  test('method page emits default-locale metadata @critical', async ({ page }) => {
    const aliasResponse = await page.goto('/method', { waitUntil: 'domcontentloaded' });
    expect(aliasResponse?.status()).toBe(404);

    const localizedPath = localeUrl('/method', { locale: defaultLocale });
    const response = await page.goto(localizedPath, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    await expect(page.getByTestId(testIds.sentinel.pageReady)).toHaveAttribute('data-state', 'ready');
    await expect(page.locator('html')).toHaveAttribute('lang', defaultLocale);

    const canonical = page.locator('head link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', expect.stringContaining(`/${defaultLocale}/method`));

    await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', expect.stringMatching(/\S/));
    await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute('content', expect.stringMatching(/\S/));
  });

  test('legacy legal shells return 404 @critical', async ({ page }) => {
    const legacyPaths = ['/privacy', '/terms', '/imprint'];

    for (const path of legacyPaths) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(404);
    }
  });

  test.describe('network policy (expected external block)', () => {
    test.describe.configure({
      annotations: [
        {
          type: ALLOW_BLOCKED_REQUESTS_ANNOTATION,
          description: 'Cross-origin navigation should trigger the blocked-request guard.',
        },
      ],
    });

    test('network policy blocks cross-origin navigation @critical', async ({ page, networkPolicy }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId(testIds.sentinel.pageReady)).toHaveAttribute('data-state', 'ready');

      networkPolicy.clearBlockedRequests();

      const probeBaseUrl = 'https://example.com/__np_probe';
      const probeUrl = `${probeBaseUrl}?t=${Date.now()}`;

      const blockedRequest = page.waitForEvent('requestfailed', (request) => request.url().startsWith(probeBaseUrl));

      await page.goto(probeUrl).catch(() => null);
      await blockedRequest;

      await expect
        .poll(() => networkPolicy.getBlockedRequests().some((url) => url.startsWith(probeBaseUrl)))
        .toBeTruthy();
    });
  });

  test('navigation and main landmarks remain axe-clean @critical', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId(testIds.sentinel.pageReady)).toHaveAttribute('data-state', 'ready');

    const builder = new AxeBuilder({ page })
      .include(byTestId(testIds.nav.root))
      .include('main#main-content');
    const results = await builder.analyze();

    const criticalViolations = results.violations.filter((violation) => violation.impact === 'critical');

    const report = {
      route: '/',
      scope: ['nav', 'main'],
      violations: criticalViolations,
    };

    await testInfo.attach('axe-nav-main', {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: 'application/json',
    });

    expect(criticalViolations).toHaveLength(0);
  });
});
