'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { locales, defaultLocale, type SupportedLocale } from '@/next-intl.locales';
import { buttons, cn } from '@/app/(site)/_lib/ui';

type HeaderProps = {
  onCta?: () => void;
};

export default function Header({ onCta }: HeaderProps) {
  const t = useTranslations('header');
  const locale = useLocale();
  const activeLocale: SupportedLocale = locales.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : defaultLocale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleScrollToForm() {
    const form = document.getElementById('waitlist-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = form.querySelector('input, select, textarea, button') as HTMLElement | null;
      if (firstInput) firstInput.focus({ preventScroll: true });
    }
    onCta?.();
  }

  function navigateToLocale(nextLocale: string) {
    if (nextLocale === activeLocale) return;
    if (!locales.includes(nextLocale as SupportedLocale)) return;
    const params = searchParams?.toString();
    const query = params ? `?${params}` : '';
    const segments = pathname.split('/').filter(Boolean);
    const hasLocaleSegment = segments.length > 0 && locales.includes(segments[0] as SupportedLocale);
    const withoutLocale = hasLocaleSegment ? `/${segments.slice(1).join('/')}` : pathname;
    const normalized = withoutLocale === '' ? '/' : withoutLocale;
    const target = nextLocale === defaultLocale
      ? normalized
      : `/${nextLocale}${normalized === '/' ? '' : normalized}`;
    router.push(`${target}${query}`);
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
        </nav>
        <div className="ml-4 flex items-center gap-sm">
          <label className="sr-only" htmlFor="locale-select">{t('locale.label')}</label>
          <select
            id="locale-select"
            className="rounded-pill border border-border bg-bg px-sm py-xs text-sm text-text"
            value={activeLocale}
            onChange={(event) => navigateToLocale(event.target.value)}
          >
            {locales.map((value) => (
              <option key={value} value={value}>
                {t(`locale.${value}` as const)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={cn(buttons.primary, 'hidden lg:inline-flex')}
            onClick={handleScrollToForm}
          >
            {t('cta')}
          </button>
        </div>
      </div>
      <div className="px-gutter pb-sm lg:hidden">
        <button type="button" className={cn(buttons.primary, 'w-full')} onClick={handleScrollToForm}>
          {t('cta')}
        </button>
      </div>
    </header>
  );
}
