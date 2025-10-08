import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

const INTERCEPT_SYMBOL = Symbol('louhen-playwright-intercept');

const analyticsResponse = {
  status: 204,
  headers: {
    'content-type': 'application/json',
    'cache-control': 'no-store',
  },
  body: '{}',
} as const;

const noopResponse = {
  status: 200,
  headers: {
    'content-type': 'text/plain',
    'cache-control': 'no-store',
  },
  body: '/* intercepted */',
} as const;

async function enableInterceptors(page: Page): Promise<() => Promise<void>> {
  const marker = page as unknown as Record<string | symbol, unknown>;
  if (marker[INTERCEPT_SYMBOL]) {
    return async () => Promise.resolve();
  }
  marker[INTERCEPT_SYMBOL] = true;

  const intercepts: Array<{ url: string | RegExp; handler: Parameters<Page['route']>[1] }> = [];

  const trackHandler: Parameters<Page['route']>[1] = async (route) => {
    await route.fulfill(analyticsResponse);
  };
  await page.route('**/api/track', trackHandler);
  intercepts.push({ url: '**/api/track', handler: trackHandler });

  const thirdPartyPatterns: Array<string | RegExp> = [
    /https:\/\/([a-z0-9-]+\.)?hcaptcha\.com\/.*/i,
    /https:\/\/www\.google-analytics\.com\/.*/i,
    /https:\/\/www\.googletagmanager\.com\/.*/i,
    /https:\/\/connect\.facebook\.net\/.*/i,
    /https:\/\/www\.facebook\.com\/tr.*/i,
    /https:\/\/stats\.g\.doubleclick\.net\/.*/i,
    /https:\/\/vitals\.vercel-insights\.com\/.*/i,
    /https:\/\/analytics\.vercel-insights\.com\/.*/i,
  ];

  for (const pattern of thirdPartyPatterns) {
    const handler: Parameters<Page['route']>[1] = async (route) => {
      await route.fulfill(noopResponse);
    };
    await page.route(pattern, handler);
    intercepts.push({ url: pattern, handler });
  }

  await page.addInitScript(() => {
    const originalSendBeacon = navigator.sendBeacon?.bind(navigator);
    navigator.sendBeacon = (url: string | URL, data?: BodyInit | null) => {
      const href = typeof url === 'string' ? url : url instanceof URL ? url.href : '';
      if (href.includes('/api/track')) {
        return true;
      }
      return originalSendBeacon ? originalSendBeacon(url, data) : true;
    };
  });

  return async () => {
    await Promise.all(intercepts.map(({ url, handler }) => page.unroute(url, handler)));
    delete marker[INTERCEPT_SYMBOL];
  };
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const detach = await enableInterceptors(page);
    await use(page);
    await detach();
  },
  context: async ({ context }, use) => {
    const cleanups = new Map<Page, () => Promise<void>>();

    const applyToPage = async (page: Page) => {
      if (cleanups.has(page)) return;
      const detach = await enableInterceptors(page);
      const closeListener = () => {
        const fn = cleanups.get(page);
        if (fn) {
          cleanups.delete(page);
          void fn();
        }
      };
      page.on('close', closeListener);
      cleanups.set(page, async () => {
        page.off('close', closeListener);
        await detach();
      });
    };

    await Promise.all(context.pages().map((page) => applyToPage(page)));

    const listener = (page: Page) => {
      void applyToPage(page);
    };
    context.on('page', listener);

    await use(context);

    context.off('page', listener);
    await Promise.all([...cleanups.values()].map((fn) => fn()));
  },
});

export const expect = test.expect;
