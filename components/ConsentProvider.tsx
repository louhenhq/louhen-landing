'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import ConsentBanner from '@/components/ConsentBanner';
import { loadFromCookie, onConsentChange, setConsent, type ConsentState } from '@/lib/shared/consent/api';

type ConsentValue = {
  analytics: boolean;
  marketing: boolean;
};

type ConsentContextValue = {
  consent: ConsentValue | null;
  state: ConsentState;
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
  initialState: ConsentState;
};

export function ConsentProvider({ children, initialState }: ConsentProviderProps) {
  const [state, setState] = useState<ConsentState>(initialState);
  const [isManagerOpen, setManagerOpen] = useState(() => initialState === 'unknown');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const current = loadFromCookie();
    setState(current);
    if (current === 'unknown' && !dismissed) {
      setManagerOpen(true);
    }

    const unsubscribe = onConsentChange((next) => {
      setState(next);
      if (next === 'unknown') {
        if (!dismissed) {
          setManagerOpen(true);
        }
        return;
      }
      setDismissed(false);
      setManagerOpen(false);
    });

    return unsubscribe;
  }, [dismissed]);

  useEffect(() => {
    if (state === 'unknown' && !dismissed) {
      setManagerOpen(true);
    }
  }, [state, dismissed]);

  const persistConsent = useCallback((value: ConsentValue) => {
    const nextState: ConsentState = value.analytics ? 'granted' : 'denied';
    setConsent(nextState);
    setDismissed(false);
    setManagerOpen(false);
  }, []);

  const openManager = useCallback(() => {
    setDismissed(false);
    setManagerOpen(true);
  }, []);

  const consentValue = useMemo<ConsentValue | null>(() => {
    if (state === 'unknown') return null;
    return { analytics: state === 'granted', marketing: false };
  }, [state]);

  const contextValue = useMemo<ConsentContextValue>(
    () => ({
      consent: consentValue,
      state,
      setConsent: persistConsent,
      openManager,
    }),
    [consentValue, state, persistConsent, openManager]
  );

  return (
    <ConsentContext.Provider value={contextValue}>
      {children}
      <ConsentBanner
        forceOpen={isManagerOpen}
        onClose={() => {
          setManagerOpen(false);
          if (state === 'unknown') {
            setDismissed(true);
          }
        }}
      />
    </ConsentContext.Provider>
  );
}
