'use client';

import type { MouseEventHandler } from 'react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
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
      <div className={cn(layout.container, 'text-center flex flex-col items-center gap-xl')}>
        <div className="flex flex-col items-center gap-md">
          <p className={cn(text.eyebrow, 'text-brand-teal')}>Louhen</p>
          <h1 className={cn(text.heading, 'max-w-3xl')}>{t('h1')}</h1>
          <p className={cn(text.subheading, 'max-w-2xl')}>{t('sub')}</p>
        </div>
        <div className="flex flex-col items-center gap-sm sm:flex-row sm:gap-md">
          <button type="button" className={buttons.primary} onClick={onCtaClick}>
            {t('cta')}
          </button>
          <a className={buttons.secondary} href="#how">
            {t('secondary')}
          </a>
        </div>
        <div className="flex flex-col items-center gap-sm">
          <span className="text-sm text-text-muted">{t('trust')}</span>
          <div className="flex flex-wrap items-center justify-center gap-sm text-xs uppercase tracking-wide text-text-muted">
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
    </section>
  );
}
