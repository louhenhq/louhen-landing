'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { legalPath } from '@/lib/routing/legalPath';
import { cn, layout } from '@/app/(site)/_lib/ui';
import { LEGAL_ENTITY } from '@/constants/site';
import { useConsent } from '@/components/ConsentProvider';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const year = new Date().getFullYear();
  const { openManager } = useConsent();

  return (
    <footer className={cn(layout.section, 'border-t border-border bg-bg')}>
      <div className={cn(layout.container, 'flex flex-col gap-md text-sm text-text-muted md:flex-row md:items-center md:justify-between')}>
        <p>© {year} {LEGAL_ENTITY}. {t('rights')}.</p>
        <nav className="flex flex-wrap items-center gap-md" aria-label="Footer">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">{t('legal.heading')}</span>
            <div className="flex flex-wrap items-center gap-md">
              <Link href={legalPath(locale, 'privacy')} prefetch={false} className="hover:text-text">
                {t('legal.privacy')}
              </Link>
              <Link href={legalPath(locale, 'terms')} prefetch={false} className="hover:text-text">
                {t('legal.terms')}
              </Link>
            </div>
          </div>
          <button type="button" className="text-left text-text-muted hover:text-text underline" onClick={openManager}>
            {t('legal.preferences')}
          </button>
        </nav>
      </div>
    </footer>
  );
}
