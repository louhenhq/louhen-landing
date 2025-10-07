'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';

type Pillar = {
  title: string;
  body: string;
};

export default function MethodPillars() {
  const t = useTranslations('method.pillars');

  const pillars = useMemo<Pillar[]>(() => {
    const raw = t.raw('items');
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const value = item as Partial<Pillar>;
        if (typeof value.title !== 'string' || typeof value.body !== 'string') return null;
        return { title: value.title, body: value.body };
      })
      .filter((pillar): pillar is Pillar => Boolean(pillar));
  }, [t]);

  return (
    <section
      data-ll="method-pillars"
      className={cn(layout.section, 'bg-bg')}
      aria-labelledby="method-pillars-title"
    >
      <div className={cn(layout.container, 'flex flex-col gap-xl')}>
        <div className="max-w-3xl">
          <h2 id="method-pillars-title" className={cn(text.heading, 'text-balance')}>
            {t('title')}
          </h2>
        </div>
        <div className="grid gap-lg md:grid-cols-2 xl:grid-cols-4">
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
