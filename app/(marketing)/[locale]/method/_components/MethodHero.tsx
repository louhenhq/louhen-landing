'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { track } from '@/lib/clientAnalytics';

export default function MethodHero() {
  const t = useTranslations('method.hero');

  useEffect(() => {
    void track('page_view', { page: '/method' });
  }, []);

  return (
    <section className={cn(layout.section, 'bg-bg')} aria-labelledby="method-hero-title">
      <div className={cn(layout.container, 'flex flex-col items-center gap-xl text-center')}>
        <div className="flex max-w-3xl flex-col gap-md">
          {t('eyebrow') ? (
            <span className={cn(text.eyebrow, 'text-brand-primary/80')}>{t('eyebrow')}</span>
          ) : null}
          <h1 id="method-hero-title" className={cn(text.heading, 'text-balance')}>
            {t('title')}
          </h1>
          <p className={cn(text.subheading, 'text-balance')}>
            {t('subtitle')}
          </p>
        </div>
        <div
          className="relative h-44 w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-bg-card shadow-card"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-brand-primary/10 to-transparent" />
        </div>
      </div>
    </section>
  );
}
