'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn, text } from '@/app/(site)/_lib/ui';
import { Button, Card } from '@/components/ui';
import { track } from '@lib/clientAnalytics';
import { useMethodExperience } from './MethodExperienceProvider';

type MethodHeroProps = {
  childName?: string | null;
};

export default function MethodHero({ childName = null }: MethodHeroProps = {}) {
  const t = useTranslations('method.hero');
  const { registerCtaInteraction, route, locale } = useMethodExperience();

  useEffect(() => {
    void track('page_view', { page: route, path: route });
  }, [locale, route]);

  const subtitle = childName
    ? t('subtitle_personalized', { name: childName })
    : t('subtitle_generic');

  return (
    <section
      data-testid="method-hero"
      data-ll="method-hero"
      className="bg-bg"
      aria-labelledby="method-hero-title"
    >
      <div className="mx-auto flex w-full max-w-[min(100%,var(--layout-max-width))] flex-col items-center gap-2xl px-gutter py-3xl text-center">
        <div className="flex max-w-3xl flex-col items-center gap-md">
          {t('eyebrow') ? (
            <span className="inline-flex items-center gap-xs rounded-pill border border-border bg-bg px-sm py-xs text-meta font-medium uppercase tracking-[0.32em] text-brand-primary">
              {t('eyebrow')}
            </span>
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
            data-testid="method-hero-cta"
            data-ll="method-hero-cta"
          >
            {t('cta')}
          </Button>
          <p className="max-w-2xl text-body-sm text-text-muted">{t('trustLine')}</p>
        </div>
        <Card
          aria-hidden="true"
          className="relative h-48 w-full max-w-3xl overflow-hidden border border-border bg-bg-card px-0 py-0"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(140deg, color-mix(in srgb, var(--color-brand-primary) 20%, transparent) 0%, color-mix(in srgb, var(--color-brand-primary) 10%, transparent) 55%, transparent 100%)',
            }}
          />
        </Card>
      </div>
    </section>
  );
}
