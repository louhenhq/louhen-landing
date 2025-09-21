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
      <div className={cn(layout.container, 'flex flex-col gap-10')}>
        <div className="max-w-2xl space-y-4 text-text">
          <h2 className={text.heading}>{t('headline')}</h2>
          <p className={text.subheading}>{t('intro')}</p>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.id} className={cn(layout.card, shadows.soft, 'flex h-full flex-col gap-md rounded-2xl p-lg')}>
              <div className="flex items-center gap-sm text-sm font-medium uppercase tracking-wide text-text-muted">
                <span aria-hidden="true" className="text-2xl">
                  {step.icon}
                </span>
                <span>{t('stepLabel', { step: index + 1 })}</span>
              </div>
              <div className="flex flex-col gap-xs">
                <h3 className="text-xl font-semibold text-text">{step.title}</h3>
                <p className={text.body}>{step.body}</p>
                {step.trust ? <p className="text-sm font-medium text-text-muted">{step.trust}</p> : null}
              </div>
            </li>
          ))}
        </ol>
        <div>
          <a href="#waitlist-form" className={`${buttons.primary} inline-flex w-full sm:w-auto`}>
            {t('cta')}
          </a>
        </div>
      </div>
    </section>
  );
}
