'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ConsentBanner, ConsentManagerDialog } from '@/components/ConsentBanner';
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
  const [bannerVisible, setBannerVisible] = useState(() => initialState === 'unknown');
  const [managerOpen, setManagerOpen] = useState(false);
  const dialogOpenRef = useRef(managerOpen);

  useEffect(() => {
    dialogOpenRef.current = managerOpen;
  }, [managerOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const current = loadFromCookie();
    setState(current);
    setBannerVisible(current === 'unknown');

    const unsubscribe = onConsentChange((next) => {
      setState(next);
      if (next === 'unknown') {
        if (!dialogOpenRef.current) {
          setBannerVisible(true);
        }
        return;
      }
      setBannerVisible(false);
      setManagerOpen(false);
      dialogOpenRef.current = false;
    });

    return unsubscribe;
  }, []);

  const persistConsent = useCallback((value: ConsentValue) => {
    const nextState: ConsentState = value.analytics ? 'granted' : 'denied';
    setBannerVisible(false);
    setManagerOpen(false);
    dialogOpenRef.current = false;
    setConsent(nextState);
  }, []);

  const openManager = useCallback(() => {
    setBannerVisible(false);
    setManagerOpen(true);
    dialogOpenRef.current = true;
  }, []);

  const handleDialogClose = useCallback(() => {
    setManagerOpen(false);
    dialogOpenRef.current = false;
    if (state === 'unknown') {
      setBannerVisible(true);
    }
  }, [state]);

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
        open={bannerVisible}
        onAccept={() => persistConsent({ analytics: true, marketing: false })}
        onDecline={() => persistConsent({ analytics: false, marketing: false })}
        onManage={openManager}
      />
      <ConsentManagerDialog
        open={managerOpen}
        onClose={handleDialogClose}
        onAccept={() => persistConsent({ analytics: true, marketing: false })}
        onDecline={() => persistConsent({ analytics: false, marketing: false })}
      />
    </ConsentContext.Provider>
  );
}
