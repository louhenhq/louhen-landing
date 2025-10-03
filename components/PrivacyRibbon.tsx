'use client';

import { cn, layout } from '@/app/(site)/_lib/ui';
import PrivacyRibbonLink from '@/components/PrivacyRibbonLink';
import { useLocale, useTranslations } from 'next-intl';

export default function PrivacyRibbon() {
  const t = useTranslations('trust.privacy');
  const trustCopy = useTranslations('trustCopy');
  const locale = useLocale();

  return (
    <section className={cn(layout.section, 'bg-brand-primary/5')}>
      <div className={cn(layout.container, 'flex flex-col gap-sm md:flex-row md:items-center md:justify-between')}>
        <div className="flex items-center gap-sm text-body text-text">
          <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 4 7v5c0 5 4 9 8 9s8-4 8-9V7l-8-4Z" />
              <path d="M10 12l2 2 4-4" />
            </svg>
          </span>
          <p className="text-body text-text">{trustCopy('gdpr')}</p>
        </div>
        <PrivacyRibbonLink href={`/${locale}/privacy`}>{t('cta')}</PrivacyRibbonLink>
      </div>
    </section>
  );
}
