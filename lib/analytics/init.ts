'use client';

import type { ConsentValue } from '@/lib/consent/state';
import { getConsent, onConsentChange } from '@/lib/clientAnalytics';

let initialised = false;

export function initAnalytics(consent: ConsentValue | null) {
  if (typeof window === 'undefined') return;
  const resolved = consent ?? getConsentValue();
  if (!resolved.analytics) {
    window.__LOUHEN_ANALYTICS_READY = false;
    return;
  }

  if (initialised) {
    window.__LOUHEN_ANALYTICS_READY = true;
    return;
  }

  initialised = true;
  window.__LOUHEN_ANALYTICS_READY = true;

  onConsentChange((granted) => {
    window.__LOUHEN_ANALYTICS_READY = granted;
  });
}

function getConsentValue(): ConsentValue {
  const consent = getConsent();
  return { analytics: consent, marketing: false };
}
