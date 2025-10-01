'use client';

import type { MouseEventHandler } from 'react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import HeroTwinBadge from '@/components/HeroTwinBadge';
import { buttons, cn, layout, text } from '@/app/(site)/_lib/ui';
import PodiatristBadge, { LouhenFitBadge } from '@/app/(site)/components/PodiatristBadge';

type HeroProps = {
  onJoinClick: () => void;
};

export default function Hero({ onJoinClick }: HeroProps) {
  const t = useTranslations('hero');
  const trust = useTranslations('trust');
  const trustBadges = useMemo(() => {
    const raw = trust.raw('badges') as Record<string, string> | undefined;
    return raw ? Object.values(raw) : [];
  }, [trust]);
  const onCtaClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    onJoinClick();
  };

  return (
    <section className={cn(layout.section, 'bg-bg')}>
      <div className={cn(layout.container, layout.grid, 'items-center text-center md:text-left')}>
        <div className="md:col-span-10 md:col-start-2 lg:col-span-8 lg:col-start-3 flex flex-col items-center gap-md md:items-start">
          <p className={cn(text.eyebrow, 'text-brand-primary')}>Louhen</p>
          <h1 className={cn(text.hero, 'max-w-3xl text-balance')}>{t('h1')}</h1>
          <p className={cn(text.subheading, 'max-w-2xl text-balance')}>{t('sub')}</p>
        </div>
        <div className="md:col-span-6 md:col-start-4 lg:col-span-4 lg:col-start-5 mt-lg flex flex-col items-center gap-sm sm:flex-row sm:justify-center sm:gap-md md:items-stretch md:justify-start">
          <button type="button" className={buttons.primary} onClick={onCtaClick}>
            {t('cta')}
          </button>
          <a className={buttons.secondary} href="#how">
            {t('secondary')}
          </a>
        </div>
        <div className="md:col-span-12 mt-lg flex flex-col items-center gap-sm md:items-start">
          <HeroTwinBadge />
          <div className="flex flex-col items-center gap-sm md:flex-row md:flex-wrap md:items-center md:gap-sm">
            <span className={text.bodyMuted}>{t('trust')}</span>
            <div className="flex flex-wrap items-center justify-center gap-sm text-meta text-text-muted md:justify-start">
              {trustBadges.map((badge: string) => (
                <span key={badge} className="rounded-pill border border-border px-md py-xs">
                  {badge}
                </span>
              ))}
              <PodiatristBadge variant="inline" />
              <LouhenFitBadge variant="inline" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
