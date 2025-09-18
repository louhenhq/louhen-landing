'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

type ConfirmState = 'confirmed' | 'expired' | 'already' | 'invalid';

export default function ConfirmAnalytics({ state }: { state: ConfirmState }) {
  useEffect(() => {
    if (state === 'confirmed' || state === 'already') {
      track({ name: 'wl_confirm_success', token_status: 'valid' });
    } else if (state === 'expired') {
      track({ name: 'wl_confirm_expired', token_status: 'expired' });
    }
  }, [state]);

  return null;
}
