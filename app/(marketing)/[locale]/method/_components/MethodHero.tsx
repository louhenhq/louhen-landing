'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { Button } from '@/components/ui';
import type { SupportedLocale } from '@/next-intl.locales';
import { track } from '@/lib/clientAnalytics';
import { useMethodExperience } from './MethodExperienceProvider';

type MethodHeroProps = {
  locale: SupportedLocale;
  childName: string | null;
};

export default function MethodHero({ locale, childName }: MethodHeroProps) {
  const t = useTranslations('method.hero');
  const { registerCtaInteraction, route } = useMethodExperience();

  useEffect(() => {
    void track('page_view', { page: route, path: route });
  }, [locale, route]);

  const subtitle = childName ? t('subtitle_personalized', { name: childName }) : t('subtitle_generic');

  return (
    <section
      className={cn(layout.section, 'bg-bg')}
      aria-labelledby="method-hero-title"
      data-testid="method-hero"
    >
      <div className={cn(layout.container, 'flex flex-col items-center gap-xl text-center')}>
        <div className="flex max-w-3xl flex-col gap-md">
          {t('eyebrow') ? (
            <span className={cn(text.eyebrow, 'text-brand-primary/80')}>{t('eyebrow')}</span>
          ) : null}
          <h1 id="method-hero-title" className={cn(text.hero, 'text-balance')}>
            {t('title')}
          </h1>
          <p className={cn(text.subheading, 'text-balance')}>
            {subtitle}
          </p>
        </div>
        <div className="flex flex-col items-center gap-md">
          <Button
            as="a"
            href={`/${locale}/waitlist`}
            prefetch={false}
            onClick={() => registerCtaInteraction('hero')}
          >
            {t('cta')}
          </Button>
          <p className="max-w-2xl text-body-sm text-text-muted">{t('trustLine')}</p>
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
