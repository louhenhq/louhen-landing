'use client';

import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { buttons, cn, layout, text } from '@/app/(site)/_lib/ui';
import type { SupportedLocale } from '@/next-intl.locales';
import { track } from '@lib/clientAnalytics';

type MethodCtaProps = {
  locale: SupportedLocale;
};

export default function MethodCta({ locale }: MethodCtaProps) {
  const t = useTranslations('method.cta');

  const href = useMemo(() => `/${locale}/waitlist`, [locale]);

  const handleClick = useCallback(() => {
    void track('cta_click', { page: '/method', cta: 'early_access' });
  }, []);

  return (
    <section
      data-ll="method-footer-cta"
      className={cn(layout.section, 'bg-brand-primary/10')}
      aria-labelledby="method-cta-title"
    >
      <div className={cn(layout.container, 'flex flex-col items-center gap-md text-center')}>
        <h2 id="method-cta-title" className={cn(text.heading, 'text-balance')}>
          {t('title')}
        </h2>
        <Link
          href={href}
          className={buttons.primary}
          aria-label={t('button')}
          prefetch={false}
          onClick={handleClick}
          data-ll="method-hero-cta"
        >
          {t('button')}
        </Link>
      </div>
    </section>
  );
}
