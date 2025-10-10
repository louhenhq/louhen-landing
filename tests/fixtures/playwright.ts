import { test as base } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import type { FeatureFlags } from '@/lib/shared/flags';

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

type PublicFlagOverrides = Partial<Pick<FeatureFlags, 'ANALYTICS_ENABLED' | 'BANNER_WAITLIST_URGENCY'>>;

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

type ConsentSetter = (page?: Page) => Promise<void>;

const CONSENT_COOKIE_NAME = 'll_consent';
const CONSENT_VERSION_PREFIX = 'v1:';
const CONSENT_COOKIE_PATH = '/';

type ConsentState = 'granted' | 'denied' | 'unknown';

const consentValueMap: Record<Exclude<ConsentState, 'unknown'>, string> = {
  granted: `${CONSENT_VERSION_PREFIX}granted`,
  denied: `${CONSENT_VERSION_PREFIX}denied`,
};

type DomainTarget = {
  domain: string;
  secure: boolean;
};

const resolverCache: DomainTarget[] = [];

function resolveConsentDomains(): DomainTarget[] {
  if (resolverCache.length) {
    return resolverCache;
  }

  const targets = new Map<string, DomainTarget>();
  const baseUrl = process.env.PREVIEW_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost';
  try {
    const parsed = new URL(baseUrl);
    targets.set(parsed.hostname, {
      domain: parsed.hostname,
      secure: parsed.protocol === 'https:',
    });
  } catch {
    targets.set('localhost', { domain: 'localhost', secure: false });
  }

  // Always support local development fallbacks.
  targets.set('localhost', { domain: 'localhost', secure: false });
  targets.set('127.0.0.1', { domain: '127.0.0.1', secure: false });

  resolverCache.push(...targets.values());
  return resolverCache;
}

async function applyConsentState(context: BrowserContext, state: ConsentState): Promise<void> {
  const targets = resolveConsentDomains();
  if (state === 'unknown') {
    const expires = Math.floor(Date.now() / 1000) - 60;
    await context.addCookies(
      targets.map(({ domain, secure }) => ({
        name: CONSENT_COOKIE_NAME,
        value: '',
        domain,
        path: CONSENT_COOKIE_PATH,
        secure,
        sameSite: 'Lax' as const,
        expires,
      }))
    );
    return;
  }

  const value = consentValueMap[state];
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
  await context.addCookies(
    targets.map(({ domain, secure }) => ({
      name: CONSENT_COOKIE_NAME,
      value,
      domain,
      path: CONSENT_COOKIE_PATH,
      secure,
      sameSite: 'Lax' as const,
      expires,
    }))
  );
}

async function verifyConsentCleared(context: BrowserContext): Promise<void> {
  const cookies = await context.cookies();
  const lingering = cookies.filter((cookie) => cookie.name === CONSENT_COOKIE_NAME);
  if (lingering.length > 0) {
    throw new Error(`Expected no ${CONSENT_COOKIE_NAME} cookie, found ${lingering.length}`);
  }
}

const consentUnknownSetter: ConsentSetter = async (page) => {
  if (!page) return;
  await page.context().clearCookies();
  await verifyConsentCleared(page.context());
};

const consentGrantedSetter: ConsentSetter = async (page) => {
  if (!page) return;
  await page.context().clearCookies();
  await applyConsentState(page.context(), 'granted');
};

const consentDeniedSetter: ConsentSetter = async (page) => {
  if (!page) return;
  await page.context().clearCookies();
  await applyConsentState(page.context(), 'denied');
};

export const test = base.extend<{
  consentGranted: ConsentSetter;
  consentDenied: ConsentSetter;
  consentUnknown: ConsentSetter;
  flags: {
    set: (overrides: PublicFlagOverrides) => Promise<void>;
    clear: () => Promise<void>;
  };
}>({
  page: async ({ page }, run) => {
    const detach = await enableInterceptors(page);
    await run(page);
    await detach();
  },
  context: async ({ context }, run) => {
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

    await run(context);

    context.off('page', listener);
    await Promise.all([...cleanups.values()].map((fn) => fn()));
  },
  flags: async ({ request }, provideFlagHelpers) => {
    const clear = async () => {
      await request.post('/api/test/flags', { data: {} });
    };
    const set = async (overrides: PublicFlagOverrides) => {
      await request.post('/api/test/flags', { data: overrides });
    };
    await provideFlagHelpers({ set, clear });
    await clear();
  },
  consentGranted: async ({ page }, apply) => {
    await apply(async (target = page) => {
      await consentGrantedSetter(target);
    });
  },
  consentDenied: async ({ page }, apply) => {
    await apply(async (target = page) => {
      await consentDeniedSetter(target);
    });
  },
  consentUnknown: async ({ page }, apply) => {
    await apply(async (target = page) => {
      await consentUnknownSetter(target);
    });
  },
});

export const expect = test.expect;
