'use client';

import { useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

type IntentPrefetchOptions = {
  enabled?: boolean;
};

type IntentPrefetchHandlers = {
  onPointerEnter?: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  onTouchStart?: () => void;
};

export function useIntentPrefetch(
  href: string | null,
  { enabled = true }: IntentPrefetchOptions = {}
): IntentPrefetchHandlers {
  const router = useRouter();
  const prefetchedRef = useRef(false);

  const trigger = useCallback(() => {
    if (!enabled || !href || prefetchedRef.current) {
      return;
    }
    prefetchedRef.current = true;
    void router.prefetch(href);
  }, [enabled, href, router]);

  return useMemo(() => {
    if (!enabled || !href) {
      return {};
    }

    return {
      onPointerEnter: trigger,
      onMouseEnter: trigger,
      onFocus: trigger,
      onTouchStart: trigger,
    } satisfies IntentPrefetchHandlers;
  }, [enabled, href, trigger]);
}

export type { IntentPrefetchHandlers };
