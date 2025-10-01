'use client';

import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';

export default function FounderNote() {
  const t = useTranslations('method.founder');

  return (
    <section className={cn(layout.section, 'bg-brand-primary/5')} aria-labelledby="method-founder-title">
      <div className={cn(layout.container, 'flex flex-col gap-md md:flex-row md:items-start md:gap-xl')}>
        <h2 id="method-founder-title" className={cn(text.heading, 'text-balance md:w-1/3')}>
          {t('title')}
        </h2>
        <p className={cn(text.body, 'md:w-2/3 text-text-muted')}>{t('body')}</p>
      </div>
    </section>
  );
}
