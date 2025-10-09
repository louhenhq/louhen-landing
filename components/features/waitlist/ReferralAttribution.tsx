'use client';

import { useEffect, useMemo, useState } from 'react';
import { applyReferralFromURL } from '@app/(site)/_lib/referral';
import { cn } from '@app/(site)/_lib/ui';

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
  message?: string | null;
};

function toUrlSearchParams(input: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      params.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => {
        if (typeof v === 'string') params.append(key, v);
      });
    }
  }
  return params;
}

export function ReferralAttribution({ searchParams, message }: Props) {
  const params = useMemo(() => toUrlSearchParams(searchParams), [searchParams]);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const didApply = applyReferralFromURL(params);
    if (didApply) setApplied(true);
  }, [params]);

  if (!applied || !message) return null;

  return (
    <div className="w-full px-gutter py-md" aria-live="polite" data-ll="wl-referral">
      <div className={cn('mx-auto max-w-3xl rounded-2xl border border-status-success/40 bg-status-success/10 px-md py-sm text-sm text-status-success')}>
        {message}
      </div>
    </div>
  );
}
