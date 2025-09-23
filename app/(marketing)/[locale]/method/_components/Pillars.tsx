'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';

type Pillar = {
  title: string;
  body: string;
};

export default function Pillars() {
  const t = useTranslations('method.pillars');

  const pillars = useMemo<Pillar[]>(
    () => [
      { title: t('oneTitle'), body: t('oneBody') },
      { title: t('twoTitle'), body: t('twoBody') },
      { title: t('threeTitle'), body: t('threeBody') },
    ],
    [t]
  );

  return (
    <section className={cn(layout.section, 'bg-bg')} aria-labelledby="method-pillars-title">
      <div className={cn(layout.container, 'flex flex-col gap-xl')}>
        <div className="max-w-3xl">
          <h2 id="method-pillars-title" className={cn(text.heading, 'text-balance')}>
            {t('title')}
          </h2>
        </div>
        <div className="grid gap-lg md:grid-cols-2 xl:grid-cols-3">
          {pillars.map((pillar) => (
            <article key={pillar.title} className={cn(layout.card, 'flex h-full flex-col gap-sm px-gutter py-xl')}>
              <h3 className="text-xl font-semibold text-text">{pillar.title}</h3>
              <p className="text-base leading-relaxed text-text-muted">{pillar.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
