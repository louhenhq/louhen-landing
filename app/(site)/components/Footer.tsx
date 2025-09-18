'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn, layout } from '@/app/(site)/_lib/ui';
import { LEGAL_ENTITY } from '@/constants/site';
import { useConsent } from '@/app/(site)/components/ConsentProvider';

export default function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();
  const { openPreferences } = useConsent();

  return (
    <footer className={cn(layout.section, 'border-t border-border bg-bg')}>
      <div className={cn(layout.container, 'flex flex-col gap-md text-sm text-text-muted md:flex-row md:items-center md:justify-between')}>
        <p>© {year} {LEGAL_ENTITY}. {t('rights')}.</p>
        <nav className="flex flex-wrap items-center gap-md" aria-label="Footer">
          <Link href="/privacy" prefetch={false} className="hover:text-text">
            {t('legal.privacy')}
          </Link>
          <Link href="/terms" prefetch={false} className="hover:text-text">
            {t('legal.terms')}
          </Link>
          <Link href="/imprint" prefetch={false} className="hover:text-text">
            {t('legal.imprint')}
          </Link>
          <button type="button" className="text-left text-text-muted hover:text-text underline" onClick={openPreferences}>
            {t('legal.preferences')}
          </button>
        </nav>
      </div>
    </footer>
  );
}
