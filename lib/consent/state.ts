import { COOKIE_NAME, parseConsentCookie, serializeConsentCookie, type ConsentCookieValue } from '@/lib/consent/cookie';

export type ConsentValue = {
  analytics: boolean;
  marketing: boolean;
};

const DEFAULT_CONSENT: ConsentValue = { analytics: false, marketing: false };

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

export function getServerConsent(headers: { get(name: string): string | null } | string | null | undefined): ConsentValue {
  const parsed = parseConsentCookie(headers);
  if (parsed) {
    return {
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
    };
  }
  return { ...DEFAULT_CONSENT };
}

export function getClientConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  if (window.__LOUHEN_CONSENT__) {
    return {
      analytics: Boolean(window.__LOUHEN_CONSENT__.analytics),
      marketing: Boolean(window.__LOUHEN_CONSENT__.marketing),
    };
  }
  const parsed = parseConsentCookie(typeof document !== 'undefined' ? document.cookie : null);
  if (parsed) {
    const value: ConsentValue = { analytics: Boolean(parsed.analytics), marketing: Boolean(parsed.marketing) };
    window.__LOUHEN_CONSENT__ = { ...value, timestamp: parsed.timestamp };
    return value;
  }
  return null;
}

export function setClientConsent(value: ConsentValue) {
  if (typeof document === 'undefined') return;
  const payload: ConsentCookieValue = {
    analytics: Boolean(value.analytics),
    marketing: Boolean(value.marketing),
    timestamp: new Date().toISOString(),
  };
  const cookie = serializeConsentCookie(payload);
  document.cookie = cookie;
  if (typeof window !== 'undefined') {
    window.__LOUHEN_CONSENT__ = { analytics: payload.analytics, marketing: payload.marketing, timestamp: payload.timestamp };
    window.dispatchEvent(new CustomEvent('louhen:consent', { detail: { analytics: payload.analytics } }));
  }
}

export function clearClientConsent() {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  if (typeof window !== 'undefined') {
    window.__LOUHEN_CONSENT__ = undefined;
    window.dispatchEvent(new CustomEvent('louhen:consent', { detail: { analytics: false } }));
  }
}
