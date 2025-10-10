export type ConsentState = 'granted' | 'denied' | 'unknown';

type ConsentListener = (state: ConsentState) => void;

const COOKIE_NAME = 'll_consent';
const COOKIE_VERSION = 'v1';
const COOKIE_PREFIX = `${COOKIE_VERSION}:`;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 12 months

let currentState: ConsentState = 'unknown';

const listeners = new Set<ConsentListener>();

if (typeof document !== 'undefined') {
  const state = parseConsentFromCookie(document.cookie);
  syncWindowState(state);
  currentState = state;
}

export function getConsent(): ConsentState {
  return currentState;
}

export function setConsent(next: ConsentState): void {
  applyState(next, { persist: true, notify: true });
}

export function onConsentChange(listener: ConsentListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function loadFromCookie(cookieString?: string | null): ConsentState {
  const source = cookieString ?? readDocumentCookie();
  const next = parseConsentFromCookie(source);

  if (typeof window !== 'undefined' && cookieString === undefined) {
    applyState(next, { persist: false, notify: false });
  }

  return next;
}

export function saveToCookie(next: ConsentState): void {
  if (typeof document === 'undefined') return;

  const directives = ['Path=/', 'SameSite=Lax'];
  if (process.env.NODE_ENV === 'production') {
    directives.push('Secure');
  }

  if (next === 'unknown') {
    directives.push('Max-Age=0');
    document.cookie = `${COOKIE_NAME}=; ${directives.join('; ')}`;
    return;
  }

  directives.push(`Max-Age=${MAX_AGE_SECONDS}`);
  const value = encodeURIComponent(`${COOKIE_PREFIX}${next}`);
  document.cookie = `${COOKIE_NAME}=${value}; ${directives.join('; ')}`;
}

export function clearConsent(): void {
  applyState('unknown', { persist: true, notify: true });
}

export function parseConsentFromCookie(cookieString: string | null | undefined): ConsentState {
  if (!cookieString) return 'unknown';
  const parts = cookieString.split(';');
  for (const part of parts) {
    const [rawKey, ...rest] = part.split('=');
    if (!rawKey) continue;
    if (rawKey.trim() !== COOKIE_NAME) continue;
    const rawValue = rest.join('=');
    if (!rawValue) return 'unknown';
    const decoded = decodeURIComponent(rawValue.trim());
    if (decoded === `${COOKIE_PREFIX}granted`) return 'granted';
    if (decoded === `${COOKIE_PREFIX}denied`) return 'denied';
    return 'unknown';
  }
  return 'unknown';
}

function applyState(next: ConsentState, options: { persist?: boolean; notify?: boolean } = {}): void {
  const persist = options.persist ?? false;
  const notify = options.notify ?? true;
  const changed = currentState !== next;

  currentState = next;

  if (persist) {
    saveToCookie(next);
  }

  syncWindowState(next);

  if (!changed || !notify) return;

  for (const listener of listeners) {
    listener(next);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('louhen:consent', { detail: { state: next, analytics: next === 'granted' } }));
  }
}

function readDocumentCookie(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    return document.cookie;
  } catch {
    return null;
  }
}

function syncWindowState(state: ConsentState): void {
  if (typeof window === 'undefined') return;
  window.__LL_CONSENT__ = state;
  const legacy = window.__LOUHEN_CONSENT__ ?? {};
  window.__LOUHEN_CONSENT__ = {
    ...legacy,
    analytics: state === 'granted',
    marketing: false,
    state,
    updatedAt: new Date().toISOString(),
  };
}
