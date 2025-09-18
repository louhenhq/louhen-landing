'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/app/(site)/_lib/ui';
import TrustModal from '@/app/(site)/components/TrustModals';

type Props = {
  variant?: 'default' | 'inline';
};

export default function PodiatristBadge({ variant = 'default' }: Props) {
  const t = useTranslations('trust.podiatrist');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={cn(
          'flex items-center gap-xs rounded-pill border border-border px-sm py-xs text-xs font-medium text-text hover:border-border-strong',
          variant === 'inline' ? 'bg-bg' : 'bg-bg-card shadow-card'
        )}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span role="img" aria-hidden className="text-base">👣</span>
        {t('badge')}
      </button>
      <TrustModal
        id="podiatrist"
        open={open}
        onClose={() => setOpen(false)}
        title={t('title')}
        body={t('body')}
      />
    </>
  );
}

export function LouhenFitBadge({ variant = 'default' }: Props) {
  const t = useTranslations('trust.louhenfit');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={cn(
          'flex items-center gap-xs rounded-pill border border-border px-sm py-xs text-xs font-medium text-text hover:border-border-strong',
          variant === 'inline' ? 'bg-bg' : 'bg-bg-card shadow-card'
        )}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <span role="img" aria-hidden className="text-base">🛡️</span>
        {t('badge')}
      </button>
      <TrustModal
        id="louhenfit"
        open={open}
        onClose={() => setOpen(false)}
        title={t('title')}
        body={t('body')}
      />
    </>
  );
}
