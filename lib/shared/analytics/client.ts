import type { AnalyticsEventName, AnalyticsEventPayload, AnalyticsEventPropsMap, IdentifyProps } from '@/lib/analytics.schema';
import { getConsent as getConsentState, loadFromCookie, onConsentChange as subscribeToConsent, type ConsentState } from '@/lib/shared/consent/api';
import { getFlags } from '@/lib/shared/flags';

const DEFAULT_ENDPOINT = '/api/track';
const DEDUPE_WINDOW_MS = 1000;
const UTM_SESSION_KEY = 'louhen:utm';
const APP_VERSION = process.env.NEXT_PUBLIC_COMMIT_SHA || 'dev';
const ANALYTICS_DEBUG = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1';
const ANALYTICS_ENABLED = getFlags().ANALYTICS_ENABLED;
const ANALYTICS_DISABLED = !ANALYTICS_ENABLED;

const isBrowser = typeof window !== 'undefined';

export type { AnalyticsEventName, AnalyticsEventPayload } from '@/lib/analytics.schema';

export type AnalyticsProps<E extends AnalyticsEventName> = AnalyticsEventPropsMap[E];

export type AnalyticsTrackArg<E extends AnalyticsEventName> = AnalyticsEventPayload<E>;

type GenericPayload = Record<string, unknown>;
type PendingPayload = GenericPayload & { name: AnalyticsEventName };

type ConsentListener = (analyticsGranted: boolean) => void;

type UtmKeys = 'source' | 'medium' | 'campaign' | 'content' | 'term';
type UtmData = Partial<Record<UtmKeys, string>>;

type InitConfig = {
  endpoint: string;
  nonce?: string;
  consentState: ConsentState;
};

declare global {
  interface Window {
    __captureAnalytics__?: (payload: unknown) => void;
    __LOUHEN_ANALYTICS_READY?: boolean;
  }
}

const consentListeners = new Set<ConsentListener>();
const dedupeCache = new Map<string, number>();
const pendingQueue: PendingPayload[] = [];
let flushPromise: Promise<void> | null = null;
let cachedUtm: UtmData | null = null;
let consentGranted = false;
let bootstrapConfig: Pick<InitConfig, 'endpoint' | 'nonce'> | null = null;
let eventEndpoint = DEFAULT_ENDPOINT;

if (isBrowser) {
  const initialState = loadFromCookie();
  consentGranted = initialState === 'granted';
  setAnalyticsReady(consentGranted);

  subscribeToConsent((state) => {
    const granted = state === 'granted';
    consentGranted = granted;
    setAnalyticsReady(granted && Boolean(bootstrapConfig));
    notifyConsentListeners(granted);
    if (granted) {
      void flushQueue();
    } else {
      pendingQueue.length = 0;
      dedupeCache.clear();
    }
  });
}

export function init(config: InitConfig): void {
  bootstrapConfig = { endpoint: config.endpoint, nonce: config.nonce };
  eventEndpoint = config.endpoint || DEFAULT_ENDPOINT;

  if (config.consentState !== 'granted') {
    setAnalyticsReady(false);
    return;
  }

  consentGranted = true;
  setAnalyticsReady(true);
  void flushQueue();
}

export function flush(): Promise<void> {
  return flushQueue();
}

export function onConsentChange(listener: ConsentListener): () => void {
  consentListeners.add(listener);
  return () => {
    consentListeners.delete(listener);
  };
}

export function getConsent(): boolean {
  if (!isBrowser) return false;
  return getConsentState() === 'granted';
}

export function identify(_userProps?: IdentifyProps): void {
  if (!isBrowser || ANALYTICS_DISABLED) return;
  if (ANALYTICS_DEBUG) {
    console.info('[analytics] identify', _userProps);
  }
  // placeholder for future identify calls
}

export function observeOnce(element: Element, handler: () => void, threshold = 0.4): () => void {
  if (!isBrowser || typeof IntersectionObserver === 'undefined') {
    handler();
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.target !== element) return;
        if (!entry.isIntersecting) return;
        if (entry.intersectionRatio < threshold) return;
        handler();
        observer.unobserve(element);
        observer.disconnect();
      });
    },
    { threshold: [threshold] }
  );

  observer.observe(element);

  return () => {
    observer.unobserve(element);
    observer.disconnect();
  };
}

export function track<E extends AnalyticsEventName>(payload: AnalyticsEventPayload<E>): Promise<void>;
export function track<E extends AnalyticsEventName>(event: E, props?: AnalyticsEventPropsMap[E]): Promise<void>;
export function track<E extends AnalyticsEventName>(eventOrPayload: AnalyticsEventPayload<E> | AnalyticsEventName, maybeProps?: AnalyticsEventPropsMap[E]): Promise<void> {
  if (!isBrowser || ANALYTICS_DISABLED) {
    return Promise.resolve();
  }

  const { name, props } = normalizeArgs(eventOrPayload, maybeProps);
  const now = Date.now();
  const signature = stableStringify({ name, props });
  const lastTs = dedupeCache.get(signature);
  if (lastTs && now - lastTs < DEDUPE_WINDOW_MS) {
    if (ANALYTICS_DEBUG) {
      console.info('[analytics] dedupe', name, props);
    }
    return Promise.resolve();
  }
  dedupeCache.set(signature, now);

  const payload = buildPayload(name, props, now);

  if (ANALYTICS_DEBUG) {
    console.info('[analytics] enqueue', payload);
  }

  pendingQueue.push(payload);

  if (ANALYTICS_DEBUG) {
    try {
      const capture = (window as typeof window & { __captureAnalytics__?: (value: PendingPayload) => void }).__captureAnalytics__;
      if (typeof capture === 'function') {
        capture(payload);
      }
    } catch (error) {
      if (ANALYTICS_DEBUG) {
        console.info('[analytics] debug tap failed', error);
      }
    }
  }

  if (!consentGranted) {
    return Promise.resolve();
  }

  return flushQueue();
}

export function canTrack(): boolean {
  if (!isBrowser || ANALYTICS_DISABLED) return false;
  return consentGranted;
}

function notifyConsentListeners(granted: boolean) {
  consentListeners.forEach((listener) => {
    try {
      listener(granted);
    } catch (error) {
      if (ANALYTICS_DEBUG) {
        console.info('[analytics] consent listener error', error);
      }
    }
  });
}

function normalizeArgs<E extends AnalyticsEventName>(eventOrPayload: AnalyticsEventPayload<E> | AnalyticsEventName, maybeProps?: AnalyticsEventPropsMap[E]) {
  if (typeof eventOrPayload === 'string') {
    return { name: eventOrPayload, props: (maybeProps ?? {}) as Record<string, unknown> };
  }
  const { name, ...rest } = eventOrPayload;
  return { name, props: rest as Record<string, unknown> };
}

function buildPayload(name: AnalyticsEventName, props: Record<string, unknown>, timestamp: number): PendingPayload {
  const payload: PendingPayload = {
    name,
    ...props,
    ts: timestamp,
    app_version: APP_VERSION,
  };

  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    payload.ua = navigator.userAgent;
  }

  const page = getPageContext();
  payload.page = page;
  if (!('path' in props) && page.path) {
    payload.path = page.path;
  }
  if (!('ref' in props) && page.referrer) {
    payload.ref = page.referrer;
  }

  const utm = ensureUtm();
  Object.entries(utm).forEach(([key, value]) => {
    if (value) {
      payload[`utm_${key}`] = value;
    }
  });

  return payload;
}

function stableStringify(value: unknown): string {
  const seen = new WeakSet();
  const replacer = (_key: string, val: unknown) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (seen.has(val as object)) return val;
      seen.add(val as object);
      return Object.keys(val as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = (val as Record<string, unknown>)[key];
          return acc;
        }, {});
    }
    return val;
  };
  return JSON.stringify(value, replacer);
}

function getPageContext() {
  if (!isBrowser) return { path: '', referrer: null as string | null };
  try {
    const path = window.location.pathname + window.location.search;
    const referrer = document.referrer || null;
    return { path, referrer };
  } catch {
    return { path: '', referrer: null as string | null };
  }
}

function ensureUtm(): UtmData {
  if (cachedUtm) return cachedUtm;
  if (!isBrowser) {
    cachedUtm = {};
    return cachedUtm;
  }

  try {
    const stored = window.sessionStorage.getItem(UTM_SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UtmData;
      cachedUtm = parsed || {};
      return cachedUtm;
    }
  } catch {
    // ignore session storage access issues
  }

  const data: UtmData = {};
  try {
    const params = new URLSearchParams(window.location.search);
    const map: Record<string, UtmKeys> = {
      utm_source: 'source',
      utm_medium: 'medium',
      utm_campaign: 'campaign',
      utm_content: 'content',
      utm_term: 'term',
    };
    Object.entries(map).forEach(([param, key]) => {
      const value = params.get(param);
      if (value) {
        data[key] = value;
      }
    });
    window.sessionStorage.setItem(UTM_SESSION_KEY, JSON.stringify(data));
  } catch {
    // ignore URL/session parsing errors
  }
  cachedUtm = data;
  return cachedUtm;
}

async function flushQueue(): Promise<void> {
  if (!consentGranted || !isBrowser || ANALYTICS_DISABLED) {
    return Promise.resolve();
  }

  if (flushPromise) return flushPromise;
  flushPromise = (async () => {
    while (pendingQueue.length) {
      if (!consentGranted) break;
      const payload = pendingQueue.shift();
      if (!payload) break;
      await dispatch(payload);
    }
  })()
    .catch((error) => {
      if (ANALYTICS_DEBUG) {
        console.info('[analytics] flush error', error);
      }
    })
    .finally(() => {
      flushPromise = null;
    });

  return flushPromise;
}

async function dispatch(payload: PendingPayload, attempt = 0): Promise<void> {
  if (!isBrowser || ANALYTICS_DISABLED) return;

  const body = JSON.stringify(payload);

  try {
    if (!ANALYTICS_DEBUG && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const success = navigator.sendBeacon(eventEndpoint, new Blob([body], { type: 'application/json' }));
      if (success) return;
    }
  } catch {
    // continue to fetch fallback
  }

  try {
    const response = await fetch(eventEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    });
    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }
  } catch (error) {
    if (attempt < 2) {
      const delay = 200 * Math.pow(2, attempt);
      await sleep(delay);
      return dispatch(payload, attempt + 1);
    }
    if (ANALYTICS_DEBUG) {
      console.info('[analytics] dispatch failed', error);
    }
  }
}

function setAnalyticsReady(ready: boolean): void {
  if (typeof window === 'undefined') return;
  window.__LOUHEN_ANALYTICS_READY = ready;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
