'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { Button } from '@/components/ui';
import type { SupportedLocale } from '@/next-intl.locales';
import { track } from '@/lib/clientAnalytics';
import { useMethodExperience } from './MethodExperienceProvider';
import { getHelpSizingPath } from '../getHelpSizingPath';

type MethodHeroProps = {
  locale: SupportedLocale;
  childName: string | null;
};

export default function MethodHero({ locale, childName }: MethodHeroProps) {
  const t = useTranslations('method.hero');
  const ctaTranslations = useTranslations('method.cta');
  const { registerCtaInteraction, route } = useMethodExperience();

  useEffect(() => {
    void track('page_view', { page: route, path: route });
  }, [locale, route]);

  const defaultName = t('defaultName');
  const subtitle = t('sub', { name: childName ?? defaultName });
  const toLocalizedHref = (href: string) => {
    if (!href) return href;
    if (/^https?:\/\//.test(href)) return href;
    if (href.startsWith(`/${locale}`)) return href;
    const normalized = href.startsWith('/') ? href : `/${href}`;
    return `/${locale}${normalized}`;
  };
  const localizedHref = toLocalizedHref(ctaTranslations('waitlistHref'));
  const secondaryHref = toLocalizedHref(t('cta.secondaryHref'));
  const helpSizingPath = getHelpSizingPath(locale);
  const hasSecondary = Boolean(t('cta.secondary', { defaultValue: '' }).trim());
  const shouldRenderSecondary = Boolean(hasSecondary && secondaryHref && helpSizingPath && secondaryHref === helpSizingPath);

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
            href={localizedHref}
            prefetch={false}
            onClick={() => registerCtaInteraction('hero')}
          >
            {t('cta')}
          </Button>
          {shouldRenderSecondary ? (
            <Button as="a" href={secondaryHref} variant="secondary" prefetch={false}>
              {t('cta.secondary')}
            </Button>
          ) : null}
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
