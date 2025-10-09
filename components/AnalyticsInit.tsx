'use client';

import { useEffect } from 'react';
import { useNonce } from '@/lib/csp/nonce-context';
import { flush, init, track } from '@/lib/shared/analytics/client';
import { getConsent, onConsentChange, type ConsentState } from '@/lib/shared/consent/api';

type AnalyticsInitProps = {
  endpoint?: string;
};

export default function AnalyticsInit({ endpoint = '/api/track' }: AnalyticsInitProps) {
  const nonce = useNonce();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const consentState: ConsentState = getConsent();
    init({ endpoint, nonce, consentState });

    void track('page_view', {
      path: window.location.pathname + window.location.search,
      locale: document.documentElement.getAttribute('lang') ?? 'en',
    });

    const unsubscribe = onConsentChange((state) => {
      init({ endpoint, nonce, consentState: state });
      if (state === 'granted') {
        void flush();
      }
    });

    return unsubscribe;
  }, [endpoint, nonce]);

  return null;
}
