import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { localeUrl } from './_utils/url';

type AnalyticsEvent = {
  name?: string;
  id?: string;
  [key: string]: unknown;
};

async function interceptAnalytics(page: Page) {
  const events: AnalyticsEvent[] = [];
  await page.route('**/api/track', async (route) => {
    const request = route.request();
    let payload: unknown = request.postDataJSON?.();
    if (!payload) {
      const rawBody = request.postData();
      if (rawBody) {
        try {
          payload = JSON.parse(rawBody);
        } catch {
          payload = {};
        }
      } else {
        payload = {};
      }
    }
    events.push((payload ?? {}) as AnalyticsEvent);
    await route.fulfill({ status: 200, body: '{}' });
  });
  return events;
}

async function waitForEvent(events: AnalyticsEvent[], name: string) {
  await expect
    .poll(
      () => events.some((event) => event.name === name),
      {
        timeout: 15_000,
        intervals: [250, 500, 1000],
        message: `Expected analytics event "${name}" to be captured`,
      }
    )
    .toBeTruthy();
}

async function allowAnalytics(page: Page, events: AnalyticsEvent[]) {
  await page.exposeBinding('__captureAnalytics__', async (_source, payload) => {
    events.push((payload ?? {}) as AnalyticsEvent);
  });

  await page.addInitScript(() => {
    const value = { analytics: true, marketing: false };
    window.__LOUHEN_CONSENT__ = value;
    const payload = encodeURIComponent(JSON.stringify({ ...value, timestamp: new Date().toISOString() }));
    document.cookie = `louhen_consent=${payload}; Path=/; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('louhen:consent', { detail: { analytics: true } }));
    window.__LOUHEN_POPUPS__ = [];
    window.open = (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : null;
      if (url) {
        window.__LOUHEN_POPUPS__!.push(url);
      }
      return null;
    };

    const originalSendBeacon = typeof navigator.sendBeacon === 'function' ? navigator.sendBeacon.bind(navigator) : undefined;
    navigator.sendBeacon = (url, data) => {
      try {
        if (typeof url === 'string' && url.includes('/api/track')) {
          const pushPayload = (text: string | null) => {
            if (!text) {
              window.__captureAnalytics__?.({});
              return true;
            }
            try {
              const parsed = JSON.parse(text);
              window.__captureAnalytics__?.(parsed);
              return true;
            } catch {
              window.__captureAnalytics__?.({});
              return true;
            }
          };

          if (typeof data === 'string') {
            return pushPayload(data);
          }
          if (data instanceof Blob) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
              pushPayload(reader.result ? String(reader.result) : null);
            });
            reader.readAsText(data);
            return true;
          }
          if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
            const buffer = data instanceof ArrayBuffer ? data : (data as ArrayBufferView).buffer;
            const text = new TextDecoder().decode(buffer);
            return pushPayload(text);
          }
          return pushPayload(null);
        }
      } catch {
        // ignore and fall back to the original implementation
      }
      if (originalSendBeacon) {
        return originalSendBeacon(url, data);
      }
      return false;
    };

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const shouldCapture = (req: RequestInfo | URL) => {
        if (typeof req === 'string') return req.includes('/api/track');
        if (req instanceof URL) {
          return req.href.includes('/api/track');
        }
        if (typeof Request !== 'undefined' && req instanceof Request) {
          return req.url.includes('/api/track');
        }
        return false;
      };

      if (shouldCapture(input) && init?.method?.toUpperCase() === 'POST' && init.body) {
        try {
          let text: string | null = null;
          if (typeof init.body === 'string') {
            text = init.body;
          } else if (init.body instanceof Blob) {
            text = await init.body.text();
          } else if (init.body instanceof FormData) {
            const obj: Record<string, unknown> = {};
            init.body.forEach((value, key) => {
              obj[key] = value;
            });
            text = JSON.stringify(obj);
          }
          if (text) {
            try {
              const parsed = JSON.parse(text);
              window.__captureAnalytics__?.(parsed);
            } catch {
              window.__captureAnalytics__?.({});
            }
          }
        } catch {
          window.__captureAnalytics__?.({});
        }
      }

      return originalFetch(input, init);
    };
  });
}

const shouldSkipLanding = process.env.CI_SKIP_LANDING === '1';

if (shouldSkipLanding) {
  test.describe.skip('Landing page analytics suites', () => {
    test('skipped in CI via CI_SKIP_LANDING', () => {
      // intentionally empty
    });
  });
} else {
  test.describe('Landing Page – EN', () => {
    test('hero scroll, voucher copy/share, section views, founder placeholder', async ({ page }) => {
      const events = await interceptAnalytics(page);

      await allowAnalytics(page, events);

      await page.goto(localeUrl(), { waitUntil: 'networkidle' });
      const { origin } = new URL(page.url());
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin });

      const heroBadge = page.getByRole('button', { name: /twin parent voucher/i });
      await heroBadge.click();
      await expect(page.locator('#founder-story')).toBeVisible();
      await waitForEvent(events, 'hero_twin_badge_click');

      const copyButton = page.getByRole('button', { name: /copy voucher code/i });
      await copyButton.click();
      await expect(page.getByText(/copied/i)).toBeVisible();
      await waitForEvent(events, 'voucher_code_copy');
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('TWINS5');

      const shareButton = page.getByRole('button', { name: /share the twin voucher/i });
      await shareButton.click();
      const popups = await page.evaluate<string[]>(() => window.__LOUHEN_POPUPS__ ?? []);
      expect(Array.isArray(popups)).toBe(true);
      expect(popups.some((value) => typeof value === 'string' && value.includes('wa.me'))).toBe(true);
      await waitForEvent(events, 'voucher_share_whatsapp_click');

      await page.locator('#founder-story').scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.locator('#how').scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const sectionEvents = events
        .filter((event) => event.name === 'section_view')
        .map((event) => event.id)
        .filter((id): id is string => typeof id === 'string');
      expect(new Set(sectionEvents)).toEqual(new Set(['founder-story', 'how']));

      const howSection = page.locator('#how');
      await expect(howSection).toBeVisible();
      await expect(howSection.locator('li')).toHaveCount(3);
      await expect(howSection.getByRole('link', { name: /join the waitlist/i })).toBeVisible();

      const founderImg = page.locator('img[alt*="Martin Weis"], img[alt*="Founder"]');
      await expect(founderImg).toBeVisible();
    });
  });

  test.describe('Landing Page – DE', () => {
    test('localized copy and voucher analytics', async ({ page }) => {
      const events = await interceptAnalytics(page);
      await allowAnalytics(page, events);
      await page.goto(localeUrl(undefined, { locale: 'de-de' }), { waitUntil: 'networkidle' });
      const { origin } = new URL(page.url());
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin });

      await expect(page.getByRole('button', { name: /zwillingseltern/i })).toBeVisible();

      await page.waitForTimeout(1_200);
      const copyButton = page.getByRole('button', { name: /gutscheincode.*twins5.*kopieren/i });
      await copyButton.click();
      await expect(page.getByText(/kopiert/i)).toBeVisible();
      await waitForEvent(events, 'voucher_code_copy');
    });
  });
}
