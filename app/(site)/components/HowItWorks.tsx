'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';

type Step = { title: string; body: string };

export default function HowItWorks() {
  const t = useTranslations('how');

  const steps = useMemo<Step[]>(() => {
    const raw = t.raw('steps') as Record<string, Step> | undefined;
    return raw ? Object.values(raw) : [];
  }, [t]);

  return (
    <section id="how" className={cn(layout.section, 'bg-bg')}>
      <div className={cn(layout.container, 'flex flex-col gap-xl')}>
        <div className="max-w-3xl">
          <h2 className={text.heading}>{t('title')}</h2>
        </div>
        <div className="grid gap-lg md:grid-cols-3">
          {steps.map((step: Step, index: number) => (
            <article key={step.title} className={cn(layout.card, 'h-full px-gutter py-xl')}>
              <div className="text-label uppercase tracking-[0.24em] text-brand-primary">
                {String(index + 1).padStart(2, '0')}
              </div>
              <h3 className="mt-sm text-h3 text-text">{step.title}</h3>
              <p className="mt-sm text-body text-text-muted">{step.body}</p>
            </article>
          ))}
        </div>
        <p className="text-body text-text-muted">{t('trust')}</p>
      </div>
    </section>
  );
}
