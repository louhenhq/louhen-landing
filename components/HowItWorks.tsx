'use client';

import { buttons, cn, layout, shadows, surfaces, text } from '@/app/(site)/_lib/ui';
import { useTranslations } from 'next-intl';

type Step = {
  id: string;
  icon: string;
  title: string;
  body: string;
  trust?: string;
};

export default function HowItWorks() {
  const t = useTranslations('how');

  const steps: Step[] = [
    {
      id: 'scan',
      icon: '👣',
      title: t('scan.title'),
      body: t('scan.body'),
    },
    {
      id: 'recommend',
      icon: '🤖',
      title: t('recommend.title'),
      body: t('recommend.body'),
      trust: t('recommend.trust'),
    },
    {
      id: 'fit',
      icon: '✨',
      title: t('fit.title'),
      body: t('fit.body'),
    },
  ];

  return (
    <section id="how" className={cn(layout.section, surfaces.subtle)}>
      <div className={cn(layout.container, layout.grid, 'gap-y-xl')}>
        <div className="md:col-span-5 lg:col-span-4 space-y-4 text-text">
          <p className={cn(text.eyebrow, 'text-brand-primary/80')}>{t('eyebrow')}</p>
          <h2 className={text.heading}>{t('headline')}</h2>
          <p className={text.subheading}>{t('intro')}</p>
        </div>
        <div className="md:col-span-7 lg:col-span-8">
          <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.id} className={cn(layout.card, shadows.soft, 'flex h-full flex-col gap-md rounded-2xl p-lg')}>
                <div className="flex items-center gap-sm text-meta font-medium uppercase tracking-[0.24em] text-text-muted">
                  <span aria-hidden="true" className="text-display-lg">
                    {step.icon}
                  </span>
                  <span>{t('stepLabel', { step: index + 1 })}</span>
                </div>
                <div className="flex flex-col gap-xs">
                  <h3 className="text-h3 text-text">{step.title}</h3>
                  <p className={text.body}>{step.body}</p>
                  {step.trust ? <p className="text-body-sm font-medium text-text-muted">{step.trust}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="md:col-span-12">
          <a href="#waitlist" className={`${buttons.primary} inline-flex w-full sm:w-auto`}>
            {t('cta')}
          </a>
        </div>
      </div>
    </section>
  );
}
