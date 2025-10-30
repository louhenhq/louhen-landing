'use client';

import { useId, useMemo, useTransition, type ChangeEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { buildLocaleHref, resolveTargetLocale } from '@lib/intl/localePath';
import { locales, type SupportedLocale } from '@/next-intl.locales';
import { recordHeaderEvent, type HeaderEventContext } from '@lib/analytics/header';
import type { HeaderSurface } from '@lib/analytics.schema';
import { cn, focusRing } from '@app/(site)/_lib/ui';

type HeaderLocaleSwitcherProps = {
  variant: 'desktop' | 'mobile';
  analyticsContext: HeaderEventContext;
  surface?: HeaderSurface;
  onLocaleChange?: () => void;
};

const COOKIE_NAME = 'NEXT_LOCALE';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export default function HeaderLocaleSwitcher({ variant, analyticsContext, surface, onLocaleChange }: HeaderLocaleSwitcherProps) {
  const t = useTranslations('header');
  const activeLocale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectId = useId();
  const [isPending, startTransition] = useTransition();
  const currentLocale = resolveTargetLocale(activeLocale);
  const surfaceValue: HeaderSurface = surface ?? (variant === 'desktop' ? 'header' : 'drawer');

  const searchString = useMemo(() => searchParams?.toString() ?? '', [searchParams]);
  const currentPath = pathname ?? '/';

  const options = useMemo(() => locales.map((value) => ({ value, label: t(`locale.${value}` as const) })), [t]);

  const formAction = '/locale/switch';
  const containerTestId = variant === 'desktop' ? 'lh-nav-lang-switcher-desktop' : 'lh-nav-lang-switcher-mobile';
  const selectTestId = `${containerTestId}-select`;

  function setLocaleCookie(locale: SupportedLocale) {
    const directives = [`Max-Age=${COOKIE_MAX_AGE}`, 'Path=/', 'SameSite=Lax'];
    if (process.env.NODE_ENV === 'production') {
      directives.push('Secure');
    }
    document.cookie = `${COOKIE_NAME}=${locale}; ${directives.join('; ')}`;
  }

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const rawValue = event.target.value;
    const nextLocale = resolveTargetLocale(rawValue);
    if (nextLocale === currentLocale) return;

    const targetHref = buildLocaleHref(nextLocale, currentPath, searchString);
    setLocaleCookie(nextLocale);

    recordHeaderEvent(
      'header_locale_switch',
      analyticsContext,
      {
        from: currentLocale,
        to: nextLocale,
        target: targetHref,
        trigger: 'change',
      },
      { surface: surfaceValue }
    );
    onLocaleChange?.();
    startTransition(() => {
      void router.replace(targetHref);
    });
  };

  const containerClass = variant === 'desktop'
    ? 'inline-flex items-center gap-xs'
    : 'flex w-full flex-col gap-sm';

  const labelClass = variant === 'desktop'
    ? 'sr-only'
    : 'text-sm font-medium text-text';

  const selectClass = variant === 'desktop'
    ? cn(
        'min-w-[8rem] rounded-pill border border-border bg-bg px-sm py-xs text-sm text-text disabled:opacity-70',
        focusRing
      )
    : cn(
        'w-full rounded-pill border border-border bg-bg px-sm py-xs text-sm text-text disabled:opacity-70',
        focusRing
      );

  return (
    <form
      action={formAction}
      method="post"
      className={containerClass}
      data-testid={containerTestId}
      data-locale-switcher
      data-ll="nav-locale-switcher"
    >
      <input type="hidden" name="path" value={currentPath} />
      <input type="hidden" name="search" value={searchString} />
      <label className={labelClass} htmlFor={selectId}>
        {t('locale.label')}
      </label>
      <select
        id={selectId}
        name="locale"
        className={selectClass}
        defaultValue={currentLocale}
        onChange={handleChange}
        data-testid={selectTestId}
        aria-disabled={isPending ? 'true' : undefined}
        disabled={isPending}
        autoComplete="language"
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <noscript>
        <div className="mt-sm">
          <button
            type="submit"
            className="inline-flex items-center rounded-pill border border-border px-sm py-xs text-xs font-medium text-text"
          >
            {t('locale.submit')}
          </button>
        </div>
      </noscript>
    </form>
  );
}
