'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { locales, defaultLocale, type SupportedLocale } from '@/next-intl.locales';
import { cn, layout } from '@/app/(site)/_lib/ui';
import { LEGAL_ENTITY } from '@/constants/site';
import { useConsent } from '@/components/ConsentProvider';

export default function Footer() {
  const t = useTranslations('footer');
  const helpT = useTranslations('help');
  const locale = useLocale();
  const activeLocale: SupportedLocale = locales.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : defaultLocale;
  const helpHref = activeLocale === defaultLocale ? '/help' : `/${activeLocale}/help`;
  const helpLabel = helpT('navLabel');
  const year = new Date().getFullYear();
  const { openManager } = useConsent();

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
          <Link href={helpHref} prefetch={false} className="hover:text-text">
            {helpLabel}
          </Link>
          <button type="button" className="text-left text-text-muted hover:text-text underline" onClick={openManager}>
            {t('legal.preferences')}
          </button>
        </nav>
      </div>
    </footer>
  );
}
