'use client';

import { useTranslations } from 'next-intl';
import { buttons, cn } from '@/app/(site)/_lib/ui';

type Props = {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onManage: () => void;
};

export default function ConsentBanner({ open, onAccept, onDecline, onManage }: Props) {
  const t = useTranslations('consent.banner');
  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-modal px-gutter pb-gutter pointer-events-none">
      <div className={cn('pointer-events-auto mx-auto flex max-w-3xl flex-col gap-sm rounded-2xl border border-border bg-bg px-md py-sm shadow-card')}>
        <div className="flex flex-col gap-xs">
          <h2 className="text-base font-semibold text-text">{t('title')}</h2>
          <p className="text-sm text-text-muted">{t('body')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <button type="button" className={buttons.primary} onClick={onAccept}>
            {t('accept')}
          </button>
          <button type="button" className={buttons.secondary} onClick={onDecline}>
            {t('decline')}
          </button>
          <button type="button" className="text-sm text-text-muted underline" onClick={onManage}>
            {t('manage')}
          </button>
        </div>
      </div>
    </div>
  );
}
