'use client';

import { cn, layout, shadows, text } from '@/app/(site)/_lib/ui';
import PodiatristBadgeCta from '@/components/PodiatristBadgeCta';
import { useTranslations } from 'next-intl';

export default function PodiatristBadge() {
  const t = useTranslations('trust.podiatristCard');

  return (
    <section className={cn(layout.section)}>
      <div className={cn(layout.container)}>
        <div className={cn(layout.card, shadows.soft, 'flex flex-col gap-sm rounded-2xl border border-border bg-bg px-lg py-md md:flex-row md:items-center md:gap-md')}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mint/30 text-brand-primary" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 5.5 6v5c0 4.89 3.5 8.74 6.5 10 3-1.26 6.5-5.11 6.5-10V6L12 3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="flex flex-1 flex-col gap-xs">
            <h3 className="text-xl font-semibold text-text">{t('title')}</h3>
            <p className={text.body}>{t('body')}</p>
          </div>
          <PodiatristBadgeCta href="#method" label={t('cta')} />
        </div>
      </div>
    </section>
  );
}
