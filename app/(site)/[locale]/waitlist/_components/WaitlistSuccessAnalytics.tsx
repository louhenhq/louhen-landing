'use client';

import { useEffect } from 'react';
import { track } from '@/lib/clientAnalytics';

type WaitlistSuccessAnalyticsProps = {
  locale: string;
  timeToConfirmMs?: number | null;
};

export default function WaitlistSuccessAnalytics({ locale, timeToConfirmMs = null }: WaitlistSuccessAnalyticsProps) {
  useEffect(() => {
    void track({ name: 'waitlist_signup_confirmed', locale, timeToConfirmMs });
  }, [locale, timeToConfirmMs]);

  return null;
}
