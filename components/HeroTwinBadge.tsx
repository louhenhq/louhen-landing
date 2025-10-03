'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { badges } from '@/app/(site)/_lib/ui';
import { usePrefersReducedMotion } from '@/app/(site)/_lib/usePrefersReducedMotion';
import { track } from '@/lib/clientAnalytics';

export default function HeroTwinBadge() {
  const t = useTranslations('hero.badge');
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleClick = useCallback(() => {
    track({ name: 'hero_twin_badge_click' });
    const target = document.getElementById('founder-story');
    if (target) {
      const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
      target.scrollIntoView({ behavior, block: 'start' });
    }
  }, [prefersReducedMotion]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t('aria')}
      className={`${badges.pill} cursor-pointer`}
    >
      <span aria-hidden="true">👶</span>
      <span>{t('label')}</span>
    </button>
  );
}
