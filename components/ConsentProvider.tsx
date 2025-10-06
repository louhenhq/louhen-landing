'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import ConsentBanner from '@/components/ConsentBanner';
import { getClientConsent, setClientConsent, type ConsentValue } from '@/lib/consent/state';
import { initAnalytics } from '@/lib/analytics/init';

const DEFAULT_CONSENT: ConsentValue = { analytics: false, marketing: false };

type ConsentContextValue = {
  consent: ConsentValue | null;
  setConsent: (value: ConsentValue) => void;
  openManager: () => void;
};

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error('useConsent must be used within ConsentProvider');
  }
  return ctx;
}

type ConsentProviderProps = {
  children: ReactNode;
  initialConsent: ConsentValue;
};

export function ConsentProvider({ children, initialConsent }: ConsentProviderProps) {
  const [consent, setConsentState] = useState<ConsentValue | null>(initialConsent ?? DEFAULT_CONSENT);
  const [managerOpen, setManagerOpen] = useState(() => !initialConsent.analytics && !initialConsent.marketing);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const clientConsent = getClientConsent();
    if (clientConsent) {
      setConsentState(clientConsent);
      setManagerOpen(false);
      initAnalytics(clientConsent);
      return;
    }

    window.__LOUHEN_CONSENT__ = initialConsent;
    initAnalytics(initialConsent);
    if (initialConsent.analytics || initialConsent.marketing) {
      setConsentState(initialConsent);
      setManagerOpen(false);
    }
  }, [initialConsent]);

  const persistConsent = useCallback((value: ConsentValue) => {
    setClientConsent(value);
    setConsentState(value);
    setManagerOpen(false);
    initAnalytics(value);
  }, []);

  const openManager = useCallback(() => {
    setManagerOpen(true);
  }, []);

  const contextValue = useMemo<ConsentContextValue>(
    () => ({ consent, setConsent: persistConsent, openManager }),
    [consent, persistConsent, openManager]
  );

  return (
    <ConsentContext.Provider value={contextValue}>
      {children}
      <ConsentBanner
        open={managerOpen}
        onAccept={() => persistConsent({ analytics: true, marketing: false })}
        onReject={() => persistConsent({ analytics: false, marketing: false })}
        onClose={() => setManagerOpen(false)}
      />
    </ConsentContext.Provider>
  );
}
