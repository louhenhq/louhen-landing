'use client';

import type { MouseEventHandler } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import HeroTwinBadge from '@/components/HeroTwinBadge';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import PodiatristBadge, { LouhenFitBadge } from '@/app/(site)/components/PodiatristBadge';
import { Button } from '@/components/ui';
import { usePrefersReducedMotion } from '@/app/(site)/_lib/usePrefersReducedMotion';

type HeroProps = {
  onJoinClick: () => void;
};

export default function Hero({ onJoinClick }: HeroProps) {
  const t = useTranslations('hero');
  const trust = useTranslations('trust');
  const trustCopy = useTranslations('trustCopy');
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isAnimated, setIsAnimated] = useState(false);
  const trustBadges = useMemo(() => {
    const raw = trust.raw('badges') as Record<string, string> | undefined;
    return raw ? Object.values(raw) : [];
  }, [trust]);
  const onCtaClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    onJoinClick();
  };

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsAnimated(true);
      return;
    }
    const frame = requestAnimationFrame(() => setIsAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion]);

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      tabIndex={-1}
      className={cn(layout.section, 'bg-bg')}
      data-testid="landing-hero"
    >
      <div className={cn(layout.container, layout.grid, 'items-center gap-y-xl')}>
        <div className="md:col-span-6 lg:col-span-5 flex flex-col gap-lg">
          <div className="flex flex-col gap-sm">
            <p className={cn(text.eyebrow, 'text-brand-primary')}>Louhen</p>
            <h1 id="hero-heading" className={cn(text.hero, 'max-w-xl')}>{t('h1')}</h1>
            <p className={cn(text.subheading, 'max-w-lg')}>{t('sub')}</p>
          </div>
          <div className="flex flex-col gap-sm">
            <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:gap-sm">
              <Button size="lg" className="w-full sm:w-auto" onClick={onCtaClick}>
                {t('cta')}
              </Button>
              <Button as="a" variant="secondary" size="lg" href="#how" className="w-full sm:w-auto">
                {t('secondary')}
              </Button>
            </div>
            <p className={cn(text.meta, 'text-text-muted')}>{trustCopy('fitGuarantee')}</p>
          </div>
          <div className="flex flex-col gap-md">
            <HeroTwinBadge />
            <div className="flex flex-col gap-sm">
              <span className={text.bodyMuted}>{trustCopy('fitDetail')}</span>
              <div className="flex flex-wrap items-center gap-sm text-meta text-text-muted">
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
        <div className="md:col-span-6 md:col-start-7 lg:col-span-6 lg:col-start-7">
          <div
            aria-hidden="true"
            className={cn(
              'relative isolate flex w-full overflow-hidden rounded-2xl border border-border bg-bg-card shadow-elevated',
              'transition-all duration-700 ease-out',
              prefersReducedMotion || isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
            style={{ aspectRatio: '4 / 5', minHeight: '22rem' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-brand-primary/5 to-transparent" />
            <div className="relative z-[1] m-auto flex max-w-xs flex-col items-center gap-sm text-center">
              <span className={cn(text.meta, 'text-text-muted')}>{t('media.placeholderLabel')}</span>
              <p className={cn(text.body, 'text-text-muted')}>{t('media.placeholderBody')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
