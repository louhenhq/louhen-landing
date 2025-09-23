'use client';

import type { MouseEventHandler } from 'react';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import HeroTwinBadge from '@/components/HeroTwinBadge';
import Section from '@/components/Section';
import { buttons } from '@/app/(site)/_lib/ui';
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
    <Section pad="xl" className="bg-bg text-center">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-xl">
        <div className="flex flex-col items-center gap-sm">
          <p className="text-sm font-medium uppercase tracking-[var(--typography-letter-spacing-wide)] text-brand-teal">
            Louhen
          </p>
          <h1 className="max-w-3xl font-semibold text-balance tracking-[var(--typography-letter-spacing-tight)] text-[var(--typography-size-2xl)] leading-[var(--typography-line-height-tight)] md:text-[var(--typography-size-3xl)]">
            {t('h1')}
          </h1>
          <p className="mt-sm max-w-2xl text-[var(--typography-size-lg)] leading-[var(--typography-line-height-relaxed)] text-text-muted md:text-[var(--typography-size-xl)]">
            {t('sub')}
          </p>
        </div>
        <div className="flex flex-col items-center gap-sm sm:flex-row sm:gap-md">
          <button type="button" className={buttons.primary} onClick={onCtaClick}>
            {t('cta')}
          </button>
          <a className={buttons.secondary} href="#how">
            {t('secondary')}
          </a>
        </div>
        <HeroTwinBadge />
        <div className="flex flex-col items-center gap-sm">
          <span className="text-sm text-text-muted">{t('trust')}</span>
          <div className="flex flex-wrap items-center justify-center gap-sm text-xs uppercase tracking-[var(--typography-letter-spacing-wide)] text-text-muted">
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
    </Section>
  );
}
