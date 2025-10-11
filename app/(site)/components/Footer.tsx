'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { LEGAL_ENTITY } from '@/constants/site';
import { useConsent } from '@/components/ConsentProvider';
import LocaleSwitcher from '@/app/(site)/components/LocaleSwitcher';
import { buildPathForLocale, DEFAULT_LOCALE, FULL_LOCALES, type AppLocale } from '@/lib/i18n/locales';

export default function Footer() {
  const t = useTranslations('footer');
  const rawLocale = useLocale();
  const activeLocale = (FULL_LOCALES.includes(rawLocale as AppLocale) ? (rawLocale as AppLocale) : DEFAULT_LOCALE.value) as AppLocale;
  const to = (pathname: string) => buildPathForLocale(activeLocale, pathname);
  const year = new Date().getFullYear();
  const { openManager } = useConsent();

  return (
    <footer
      className={cn('border-t border-border/50 bg-bg/90 backdrop-blur-sm')}
      data-testid="lh-footer-site-root"
    >
      <div className={cn(layout.container, 'flex flex-col gap-xl py-[calc(var(--layout-section-padding-clamp)/1.5)]')}>
        <div className={cn(layout.grid, 'items-start gap-y-lg')}>
          <div className="md:col-span-7 lg:col-span-6">
            <p className={cn(text.meta, 'text-brand-primary/80')}>{t('trustEyebrow')}</p>
            <p className={cn(text.heading, 'mt-xs text-text')}>{t('trustHeadline')}</p>
            <p className={cn(text.bodyMuted, 'mt-sm max-w-prose')}>{t('trustBody')}</p>
          </div>
          <nav className="flex flex-col gap-sm md:col-span-5 lg:col-span-4" aria-label={t('legalNavLabel')}>
            <p className={cn(text.label, 'text-text')}>{t('legal.heading')}</p>
            <Link
              href={to('/privacy')}
              prefetch={false}
              className="touch-target touch-padding text-label text-text-muted transition-colors hover:text-text"
            >
              {t('legal.privacy')}
            </Link>
            <Link
              href={to('/terms')}
              prefetch={false}
              className="touch-target touch-padding text-label text-text-muted transition-colors hover:text-text"
            >
              {t('legal.terms')}
            </Link>
            <Link
              href={to('/imprint')}
              prefetch={false}
              className="touch-target touch-padding text-label text-text-muted transition-colors hover:text-text"
            >
              {t('legal.imprint')}
            </Link>
            <button
              type="button"
              className="touch-target touch-padding w-fit text-left text-label text-brand-primary underline decoration-2 underline-offset-4 transition-colors hover:text-brand-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              onClick={openManager}
            >
              {t('legal.preferences')}
            </button>
          </nav>
        </div>
        <div className="flex flex-col gap-sm border-t border-border/40 pt-sm text-body-sm text-text-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {LEGAL_ENTITY}. {t('rights')}.
          </p>
          <div className="flex flex-wrap items-center gap-sm">
            <LocaleSwitcher id="footer-locale" label={t('localeLabel')} />
            <span aria-hidden="true" className="text-border">•</span>
            <span>{t('dataResidency')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
