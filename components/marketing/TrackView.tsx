'use client';

import { useEffect } from 'react';
import { track } from '@/lib/clientAnalytics';

type TrackViewProps = {
  event: 'waitlist_landing_success_view' | 'waitlist_landing_expired_view';
};

export function TrackView({ event }: TrackViewProps) {
  useEffect(() => {
    track({ name: event });
  }, [event]);

  return null;
}

export default TrackView;
