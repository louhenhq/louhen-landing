import type { AnalyticsEventName, AnalyticsEventPayload, AnalyticsEventPropsMap, IdentifyProps } from '@/lib/analytics.schema';
import { parseConsentCookie } from '@/lib/consent/cookie';

const API_ENDPOINT = '/api/track';
const DEDUPE_WINDOW_MS = 1000;
const UTM_SESSION_KEY = 'louhen:utm';
const APP_VERSION = process.env.NEXT_PUBLIC_COMMIT_SHA || 'dev';
const ANALYTICS_DISABLED = process.env.NEXT_PUBLIC_ANALYTICS_DISABLED === '1';
const ANALYTICS_DEBUG = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1';

const isBrowser = typeof window !== 'undefined';

export type { AnalyticsEventName, AnalyticsEventPayload } from '@/lib/analytics.schema';

export type AnalyticsProps<E extends AnalyticsEventName> = AnalyticsEventPropsMap[E];

export type AnalyticsTrackArg<E extends AnalyticsEventName> = AnalyticsEventPayload<E>;

type GenericPayload = Record<string, unknown>;
type PendingPayload = GenericPayload & { name: AnalyticsEventName };

type ConsentListener = (analyticsGranted: boolean) => void;

type UtmKeys = 'source' | 'medium' | 'campaign' | 'content' | 'term';
type UtmData = Partial<Record<UtmKeys, string>>;

declare global {
  interface Window {
    __LOUHEN_CONSENT__?: {
      analytics?: boolean;
      marketing?: boolean;
      timestamp?: string;
    };
    __LOUHEN_ANALYTICS_READY?: boolean;
  }
}

const consentListeners = new Set<ConsentListener>();
const dedupeCache = new Map<string, number>();
const pendingQueue: PendingPayload[] = [];
let flushPromise: Promise<void> | null = null;
let cachedUtm: UtmData | null = null;
let consentGranted = !isBrowser ? true : getConsent();

if (isBrowser) {
  window.addEventListener('louhen:consent', (event: Event) => {
    const detail = (event as CustomEvent<{ analytics?: boolean }>).detail;
    if (typeof detail?.analytics === 'boolean') {
      consentGranted = detail.analytics;
    } else {
      consentGranted = getConsent();
    }
    notifyConsentListeners(consentGranted);
    if (consentGranted) {
      void flushQueue();
    } else {
      pendingQueue.length = 0;
      dedupeCache.clear();
    }
  });
}

export function onConsentChange(listener: ConsentListener): () => void {
  consentListeners.add(listener);
  return () => {
    consentListeners.delete(listener);
  };
}

export function getConsent(): boolean {
  if (!isBrowser) return true;
  try {
    const globalConsent = window.__LOUHEN_CONSENT__;
    if (globalConsent && typeof globalConsent.analytics === 'boolean') {
      return globalConsent.analytics;
    }
  } catch {
    // ignore
  }
  const parsed = parseConsentCookie(typeof document !== 'undefined' ? document.cookie : null);
  if (parsed) {
    const analyticsGranted = Boolean(parsed.analytics);
    if (typeof window !== 'undefined') {
      window.__LOUHEN_CONSENT__ = { analytics: analyticsGranted, marketing: Boolean(parsed.marketing) };
    }
    return analyticsGranted;
  }
  return false;
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

export function identify(_userProps?: IdentifyProps): void {
  if (!isBrowser || ANALYTICS_DISABLED) return;
  if (ANALYTICS_DEBUG) {
    console.info('[analytics] identify', _userProps);
  }
  // no-op for now
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

  if (ANALYTICS_DEBUG && isBrowser) {
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

  consentGranted = getConsent();
  if (!consentGranted) {
    return Promise.resolve();
  }

  return flushQueue();
}

export function canTrack(): boolean {
  if (!isBrowser || ANALYTICS_DISABLED) return false;
  return getConsent();
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
  if (flushPromise) return flushPromise;
  flushPromise = (async () => {
    while (pendingQueue.length) {
      if (!consentGranted && !getConsent()) {
        break;
      }
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
      const success = navigator.sendBeacon(API_ENDPOINT, new Blob([body], { type: 'application/json' }));
      if (success) return;
    }
  } catch {
    // continue to fetch fallback
  }

  try {
    const response = await fetch(API_ENDPOINT, {
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
