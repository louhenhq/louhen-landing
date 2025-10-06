import type { MouseEvent } from 'react';
import type { HeaderEventTrigger } from '@/lib/analytics.schema';

export function resolveInteractionTrigger<T extends HTMLElement>(event?: MouseEvent<T>): HeaderEventTrigger {
  if (!event) return 'click';

  const native = event.nativeEvent as { pointerType?: string };
  const pointerType = native?.pointerType;
  if (pointerType === 'touch') return 'touch';
  if (pointerType === 'pen') return 'pointer';
  if (pointerType === 'mouse' && event.detail === 0) {
    return 'keyboard';
  }

  if (event.detail === 0) {
    return 'keyboard';
  }

  return 'click';
}
