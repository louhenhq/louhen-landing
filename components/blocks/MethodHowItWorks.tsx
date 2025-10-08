'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { Card } from '@/components/ui';

type Step = {
  title: string;
  body: string;
};

export default function MethodHowItWorks() {
  const t = useTranslations('method.how');
  const xpTeaserRaw = t('xpTeaser', { defaultValue: '' });
  const xpTeaser = xpTeaserRaw.trim();
  const hasXpTeaser = xpTeaser.length > 0;

  const steps = useMemo<Step[]>(() => {
    const raw = t.raw('steps');
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const value = item as Partial<Step>;
        if (typeof value.title !== 'string' || typeof value.body !== 'string') return null;
        const fallbackName = t('defaultChildName', { defaultValue: 'your child' });
        const normalizedBody = value.body.replace(/\{\s*name\s*\}/g, childName ?? fallbackName);
        return { title: value.title, body: normalizedBody };
      })
      .filter((step): step is Step => Boolean(step));
  }, [childName, t]);

  return (
    <section
      id="how"
      data-ll="method-how"
      className={cn(layout.section, 'bg-bg')}
      aria-labelledby="method-how-title"
    >
      <div className={cn(layout.container, 'flex flex-col gap-xl')}>
        <div className="max-w-3xl">
          <h2 id="method-how-title" className={cn(text.heading, 'text-balance')}>
            {t('title')}
          </h2>
          {hasXpTeaser ? <p className="mt-sm text-body-sm text-text-muted">{xpTeaser}</p> : null}
        </div>
        <div data-ll="method-steps" className="grid gap-lg md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Card
                className="flex h-full flex-col gap-sm px-gutter py-xl"
                aria-label={`Step ${index + 1} of ${steps.length}: ${step.title}`}
              >
                <div className="text-label uppercase tracking-[0.24em] text-brand-primary" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="text-h3 text-text">{step.title}</h3>
                <p className="text-body text-text-muted">{step.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
