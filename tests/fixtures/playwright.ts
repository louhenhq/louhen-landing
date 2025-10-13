import { test as base } from '@playwright/test';
import type { APIRequestContext, BrowserContext, Page, ConsoleMessage, Request } from '@playwright/test';
import type { FeatureFlags } from '@/lib/shared/flags';
import { setLocaleCookie } from '@tests/e2e/_utils/url';

const INTERCEPT_SYMBOL = Symbol('louhen-playwright-intercept');
const CONSOLE_LOG_KEY = Symbol('louhen-playwright-console');
const NETWORK_LOG_KEY = Symbol('louhen-playwright-network');
const BLOCKED_REQUESTS_KEY = Symbol('louhen-playwright-blocked');
const CONTEXT_ROUTE_KEY = Symbol('louhen-playwright-context-route');

type ContextMarker = {
  [BLOCKED_REQUESTS_KEY]?: string[];
  [CONTEXT_ROUTE_KEY]?: boolean;
};

/**
 * Local network origins allowed during tests. Anything else is aborted.
 * Additional origins must be reviewed and documented alongside the testing policy.
 */
type PageDiagnostics = {
  console: Array<{ type: string; text: string; location?: string }>;
  network: Array<{
    url: string;
    method: string;
    resourceType: string;
    status?: number;
    failure?: string;
  }>;
};

function isAllowedNetworkUrl(url: string): boolean {
  if (url === 'about:blank' || url.startsWith('data:') || url.startsWith('blob:')) {
    return true;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const protocol = parsed.protocol.toLowerCase();
  if (!['http:', 'https:'].includes(protocol)) {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') {
    return true;
  }

  return false;
}

function getContextBlockedRequests(context: BrowserContext): string[] {
  const marker = context as unknown as ContextMarker;
  if (!marker[BLOCKED_REQUESTS_KEY]) {
    marker[BLOCKED_REQUESTS_KEY] = [];
  }
  return marker[BLOCKED_REQUESTS_KEY]!;
}

async function ensureContextNetworkGuard(context: BrowserContext): Promise<void> {
  const marker = context as unknown as ContextMarker;
  if (marker[CONTEXT_ROUTE_KEY]) {
    return;
  }
  const blocked = getContextBlockedRequests(context);
  await context.route('**', async (route) => {
    const requestUrl = route.request().url();
    if (isAllowedNetworkUrl(requestUrl)) {
      if (typeof route.fallback === 'function') {
        await route.fallback();
      } else {
        await route.continue();
      }
      return;
    }
    console.error(`[playwright] Blocked external request: ${requestUrl}`);
    blocked.push(requestUrl);
    await route.abort();
  });
  marker[CONTEXT_ROUTE_KEY] = true;
}

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

  const diagnostics: PageDiagnostics = {
    console: [],
    network: [],
  };
  marker[CONSOLE_LOG_KEY] = diagnostics.console;
  marker[NETWORK_LOG_KEY] = diagnostics.network;

  const consoleListener = (message: ConsoleMessage) => {
    const location = message.location();
    const entry = {
      type: message.type(),
      text: message.text(),
      location: location?.url
        ? `${location.url}:${location.lineNumber ?? 0}:${location.columnNumber ?? 0}`
        : undefined,
    };
    diagnostics.console.push(entry);
    if (diagnostics.console.length > 200) {
      diagnostics.console.shift();
    }
  };
  page.on('console', consoleListener);

  const requestFinishedListener = (request: Request) => {
    const entry = {
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
    } as PageDiagnostics['network'][number];
    diagnostics.network.push(entry);
    if (diagnostics.network.length > 200) {
      diagnostics.network.shift();
    }
    void request
      .response()
      .then((response) => {
        if (response) {
          entry.status = response.status();
        }
      })
      .catch(() => {
        // ignore missing responses (e.g., aborted requests)
      });
  };

  const requestFailedListener = (request: Request) => {
    const failure = request.failure();
    const entry: PageDiagnostics['network'][number] = {
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      failure: failure?.errorText ?? 'unknown',
    };
    diagnostics.network.push(entry);
    if (diagnostics.network.length > 200) {
      diagnostics.network.shift();
    }
  };

  page.on('requestfinished', requestFinishedListener);
  page.on('requestfailed', requestFailedListener);

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
    if (!page.isClosed()) {
      await Promise.all(intercepts.map(({ url, handler }) => page.unroute(url, handler)));
    }
    page.off('console', consoleListener);
    page.off('requestfinished', requestFinishedListener);
    page.off('requestfailed', requestFailedListener);
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
  networkPolicy: {
    getBlockedRequests: () => string[];
    clearBlockedRequests: () => void;
  };
}>({
  page: async ({ page }, run) => {
    const detach = await enableInterceptors(page);
    await run(page);
    await detach();
  },
  context: async ({ context }, run) => {
    await ensureContextNetworkGuard(context);
    const blocked = getContextBlockedRequests(context);
    blocked.length = 0;
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

    await setLocaleCookie(context);

    const listener = (page: Page) => {
      void applyToPage(page);
    };
    context.on('page', listener);

    await run(context);

    context.off('page', listener);
    await Promise.all([...cleanups.values()].map((fn) => fn()));
  },
  flags: async ({ request }, provide) => {
    await provideFlagFixture(request, provide);
  },
  networkPolicy: async ({ page }, use) => {
    const context = page.context();
    await ensureContextNetworkGuard(context);
    const blocked = getContextBlockedRequests(context);
    blocked.length = 0;
    await use({
      getBlockedRequests: () => [...blocked],
      clearBlockedRequests: () => {
        blocked.length = 0;
      },
    });
    blocked.length = 0;
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

test.afterEach(async ({ page }, testInfo) => {
  if (!page) {
    return;
  }

  const marker = page as unknown as Record<string | symbol, unknown>;

  const captureDom = async () => {
    try {
      const dom = await page.content();
      await testInfo.attach('dom-snapshot.html', {
        body: dom,
        contentType: 'text/html',
      });
    } catch {
      // ignore DOM capture failures
    }
  };

  const consoleLogs = marker[CONSOLE_LOG_KEY] as PageDiagnostics['console'] | undefined;
  const networkLogs = marker[NETWORK_LOG_KEY] as PageDiagnostics['network'] | undefined;

  const attachLogs = async () => {
    if (consoleLogs && consoleLogs.length > 0) {
      await testInfo.attach('console.logs.json', {
        body: JSON.stringify(consoleLogs, null, 2),
        contentType: 'application/json',
      });
    }

    if (networkLogs && networkLogs.length > 0) {
      await testInfo.attach('network.logs.json', {
        body: JSON.stringify(networkLogs, null, 2),
        contentType: 'application/json',
      });
    }
  };

  const captureDiagnostics = async () => {
    await captureDom();
    await attachLogs();
  };

  const blocked = getContextBlockedRequests(page.context());
  if (blocked.length > 0) {
    await captureDiagnostics();
    await testInfo.attach('blocked-requests.json', {
      body: JSON.stringify(blocked, null, 2),
      contentType: 'application/json',
    });
    blocked.length = 0;
    delete marker[CONSOLE_LOG_KEY];
    delete marker[NETWORK_LOG_KEY];
    throw new Error('Blocked external network requests detected. See blocked-requests.json attachment for details.');
  }

  if (testInfo.status === testInfo.expectedStatus) {
    delete marker[CONSOLE_LOG_KEY];
    delete marker[NETWORK_LOG_KEY];
    return;
  }

  await captureDiagnostics();

  delete marker[CONSOLE_LOG_KEY];
  delete marker[NETWORK_LOG_KEY];
});

export const expect = test.expect;

async function provideFlagFixture(
  request: APIRequestContext,
  provide: (helpers: { set: (overrides: PublicFlagOverrides) => Promise<void>; clear: () => Promise<void> }) => Promise<void>,
) {
  const clear = async () => {
    await request.post('/api/test/flags', { data: {} });
  };
  const set = async (overrides: PublicFlagOverrides) => {
    await request.post('/api/test/flags', { data: overrides });
  };
  await provide({ set, clear });
  await clear();
}
