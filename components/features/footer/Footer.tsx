'use client';

import { useLocale, useTranslations } from 'next-intl';

import { FooterLegal } from './FooterLegal';
import type { FooterLegalLink } from './FooterLegal';
import { cn, layout } from '@app/(site)/_lib/ui';
import { LEGAL_ENTITY } from '@/constants/site';
import { useConsent } from '@components/ConsentProvider';
import { legalPath } from '@lib/shared/routing/legal-path';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const year = new Date().getFullYear();
  const { openManager } = useConsent();

  const legalLinks: FooterLegalLink[] = [
    {
      id: 'privacy' as const,
      href: legalPath(locale, 'privacy'),
      label: t('legal.privacy'),
    },
    {
      id: 'terms' as const,
      href: legalPath(locale, 'terms'),
      label: t('legal.terms'),
    },
  ];

  return (
    <footer
      data-ll="footer-root"
      role="contentinfo"
      className={cn(layout.section, 'border-t border-border bg-bg')}
    >
      <div
        className={cn(
          layout.container,
          'flex flex-col gap-md text-sm text-text-muted md:flex-row md:items-center md:justify-between',
        )}
      >
        <p>
          © {year} {LEGAL_ENTITY}. {t('rights')}.
        </p>
        <FooterLegal
          heading={t('legal.heading')}
          links={legalLinks}
          onManageConsent={openManager}
          preferencesLabel={t('legal.preferences')}
        />
      </div>
    </footer>
  );
}
