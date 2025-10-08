'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { track } from '@/lib/clientAnalytics';
import type { MethodEventPosition } from '@/lib/analytics.schema';

export type MethodCtaPosition = Exclude<MethodEventPosition, 'nudge'>;

type MethodExperienceContextValue = {
  locale: string;
  route: string;
  variantPersonalized: boolean;
  hasClickedCta: boolean;
  incentiveCopy: string | null;
  registerCtaInteraction: (position?: MethodCtaPosition) => void;
  registerExitNudgeShown: () => void;
};

const MethodExperienceContext = createContext<MethodExperienceContextValue | null>(null);

type MethodExperienceProviderProps = {
  children: ReactNode;
  locale: string;
  route: string;
  variantPersonalized: boolean;
  incentiveCopy?: string | null;
};

export function MethodExperienceProvider({ children, locale, route, variantPersonalized, incentiveCopy = null }: MethodExperienceProviderProps) {
  const [ctaClicked, setCtaClicked] = useState(false);
  const exitNudgeTracked = useRef(false);

  const emitEvent = useCallback(
    (position: MethodEventPosition) => {
      const basePayload = {
        locale,
        route,
        variant_personalized: variantPersonalized,
        timestamp: new Date().toISOString(),
      } as const;

      switch (position) {
        case 'hero':
          void track('method_hero_waitlist_click', { ...basePayload, position: 'hero' });
          return;
        case 'faq_teaser':
          void track('method_faq_teaser_waitlist_click', { ...basePayload, position: 'faq_teaser' });
          return;
        case 'sticky':
          void track('method_sticky_waitlist_click', { ...basePayload, position: 'sticky' });
          return;
        case 'nudge':
          void track('method_exit_nudge_shown', { ...basePayload, position: 'nudge' });
          return;
      }

      const exhaustiveCheck: never = position;
      throw new Error(`Unhandled MethodEventPosition: ${exhaustiveCheck}`);
    },
    [locale, route, variantPersonalized]
  );

  const registerCtaInteraction = useCallback(
    (position?: MethodCtaPosition) => {
      setCtaClicked(true);
      if (position) {
        emitEvent(position);
      }
    },
    [emitEvent]
  );

  const registerExitNudgeShown = useCallback(() => {
    if (exitNudgeTracked.current) return;
    exitNudgeTracked.current = true;
    emitEvent('nudge');
  }, [emitEvent]);

  const value = useMemo<MethodExperienceContextValue>(
    () => ({
      locale,
      route,
      variantPersonalized,
      hasClickedCta: ctaClicked,
      incentiveCopy,
      registerCtaInteraction,
      registerExitNudgeShown,
    }),
    [ctaClicked, incentiveCopy, locale, registerCtaInteraction, registerExitNudgeShown, route, variantPersonalized]
  );

  return <MethodExperienceContext.Provider value={value}>{children}</MethodExperienceContext.Provider>;
}

export function useMethodExperience() {
  const context = useContext(MethodExperienceContext);
  if (!context) {
    throw new Error('useMethodExperience must be used within MethodExperienceProvider');
  }
  return context;
}
