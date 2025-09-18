'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { ConsentCategories } from '@/app/(site)/_lib/consent';
import { getConsent, setConsent } from '@/app/(site)/_lib/consent';
import ConsentBanner from '@/app/(site)/components/ConsentBanner';
import ConsentDialog from '@/app/(site)/components/ConsentDialog';

type ConsentContextValue = {
  consent: ConsentCategories | null;
  openPreferences: () => void;
  updateConsent: (value: ConsentCategories) => void;
};

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error('useConsent must be used within ConsentProvider');
  }
  return ctx;
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<ConsentCategories | null>(null);
  const [initialised, setInitialised] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = getConsent();
    setConsentState(stored);
    setInitialised(true);
    if (!stored) setBannerOpen(true);
  }, []);

  const saveConsent = (value: ConsentCategories) => {
    setConsent(value);
    setConsentState(value);
    setBannerOpen(false);
    setDialogOpen(false);
  };

  const openPreferences = useCallback(() => setDialogOpen(true), []);

  const value = useMemo<ConsentContextValue>(
    () => ({ consent, openPreferences, updateConsent: saveConsent }),
    [consent, openPreferences]
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {initialised && (
        <>
          <ConsentBanner
            open={bannerOpen}
            onAccept={() => saveConsent({ analytics: true, marketing: false })}
            onDecline={() => saveConsent({ analytics: false, marketing: false })}
            onManage={() => {
              setBannerOpen(false);
              setDialogOpen(true);
            }}
          />
          <ConsentDialog
            open={dialogOpen}
            consent={consent ?? { analytics: false, marketing: false }}
            onClose={() => setDialogOpen(false)}
            onSave={saveConsent}
          />
        </>
      )}
    </ConsentContext.Provider>
  );
}
