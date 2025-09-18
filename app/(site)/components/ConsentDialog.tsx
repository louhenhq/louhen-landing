'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ConsentCategories } from '@/app/(site)/_lib/consent';
import { buttons, cn } from '@/app/(site)/_lib/ui';

type Props = {
  open: boolean;
  consent: ConsentCategories;
  onClose: () => void;
  onSave: (value: ConsentCategories) => void;
};

export default function ConsentDialog({ open, consent, onClose, onSave }: Props) {
  const t = useTranslations('consent.manage');
  const [analytics, setAnalytics] = useState(consent.analytics);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAnalytics(consent.analytics);
  }, [consent]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstButton = dialogRef.current?.querySelector<HTMLElement>('button');
    firstButton?.focus();
    return () => {
      document.removeEventListener('keydown', handleKey);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-bg/70 px-gutter" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-dialog-title"
        className={cn('w-full max-w-lg rounded-2xl border border-border bg-bg-card px-gutter py-xl shadow-card')}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
      >
        <div className="flex flex-col gap-md">
          <div className="flex items-start justify-between gap-sm">
            <div>
              <h2 id="consent-dialog-title" className="text-lg font-semibold text-text">{t('title')}</h2>
              <p className="text-sm text-text-muted">{t('description')}</p>
            </div>
            <button type="button" aria-label={t('close')} className="text-text-muted" onClick={onClose}>
              ×
            </button>
          </div>
          <label className="flex items-start gap-sm rounded-lg border border-border bg-bg px-md py-sm">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(event) => setAnalytics(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <span className="text-sm text-text-muted leading-relaxed">{t('analytics')}</span>
          </label>
          <div className="flex items-center justify-end gap-sm">
            <button type="button" className={buttons.secondary} onClick={onClose}>
              {t('cancel')}
            </button>
            <button
              type="button"
              className={buttons.primary}
              onClick={() => onSave({ analytics, marketing: false })}
            >
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
