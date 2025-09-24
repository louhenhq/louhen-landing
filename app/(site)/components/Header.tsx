'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { buttons, cn } from '@/app/(site)/_lib/ui';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { locales, defaultLocale, type SupportedLocale } from '@/next-intl.locales';

type HeaderProps = {
  onCta?: () => void;
};

export default function Header({ onCta }: HeaderProps) {
  const t = useTranslations('header');
  const helpT = useTranslations('help');
  const locale = useLocale();
  const activeLocale: SupportedLocale = locales.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : defaultLocale;
  const helpHref = activeLocale === defaultLocale ? '/help' : `/${activeLocale}/help`;
  const helpLabel = helpT('navLabel');

  function handleScrollToForm() {
    const form = document.getElementById('waitlist-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = form.querySelector('input, select, textarea, button') as HTMLElement | null;
      if (firstInput) firstInput.focus({ preventScroll: true });
    }
    onCta?.();
  }

  return (
    <header className="sticky top-0 z-header border-b border-border/60 backdrop-blur bg-bg/80">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-sm px-gutter py-sm">
        <Link href="/" prefetch={false} className="text-base font-semibold tracking-tight">
          {t('logo')}
        </Link>
        <nav className="ml-auto hidden items-center gap-lg lg:flex" aria-label="Primary">
          <a className="text-sm text-text-muted transition-colors hover:text-text" href="#how">
            {t('nav.how')}
          </a>
          <a className="text-sm text-text-muted transition-colors hover:text-text" href="#story">
            {t('nav.story')}
          </a>
          <a className="text-sm text-text-muted transition-colors hover:text-text" href="#faq">
            {t('nav.faq')}
          </a>
          <Link className="text-sm text-text-muted transition-colors hover:text-text" href={helpHref} prefetch={false}>
            {helpLabel}
          </Link>
        </nav>
        <div className="ml-4 flex items-center gap-sm">
          <label className="sr-only" htmlFor="locale-switcher-select">{t('locale.label')}</label>
          <LocaleSwitcher id="locale-switcher-select" className="rounded-pill border border-border bg-bg px-sm py-xs text-sm text-text" />
          <button
            type="button"
            className={cn(buttons.primary, 'hidden lg:inline-flex')}
            onClick={handleScrollToForm}
          >
            {t('cta')}
          </button>
        </div>
      </div>
      <div className="px-gutter pb-sm lg:hidden space-y-sm">
        <button type="button" className={cn(buttons.primary, 'w-full')} onClick={handleScrollToForm}>
          {t('cta')}
        </button>
        <Link className="text-sm text-text-muted underline" href={helpHref} prefetch={false}>
          {helpLabel}
        </Link>
      </div>
    </header>
  );
}
