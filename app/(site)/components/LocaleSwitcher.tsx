'use client';

import { useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/app/(site)/_lib/ui';
import { locales, defaultLocale, type SupportedLocale } from '@/next-intl.locales';

type LocaleSwitcherProps = {
  id?: string;
  className?: string;
  label?: string;
};

export default function LocaleSwitcher({ id = 'locale-switcher', className, label }: LocaleSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations('header.locale');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeLocale: SupportedLocale = locales.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : defaultLocale;

  const options = useMemo(
    () =>
      locales.map((value) => ({
        value,
        label: t(value, { default: value.toUpperCase() }),
      })),
    [t]
  );

  const navigateToLocale = useCallback(
    (nextLocale: string) => {
      if (nextLocale === activeLocale) return;
      if (!locales.includes(nextLocale as SupportedLocale)) return;

      const params = searchParams?.toString();
      const query = params ? `?${params}` : '';
      const segments = pathname.split('/').filter(Boolean);
      const hasLocaleSegment = segments.length > 0 && locales.includes(segments[0] as SupportedLocale);
      const withoutLocale = hasLocaleSegment ? `/${segments.slice(1).join('/')}` : pathname;
      const normalized = withoutLocale === '' ? '/' : withoutLocale;
      const target = nextLocale === defaultLocale ? normalized : `/${nextLocale}${normalized === '/' ? '' : normalized}`;

      router.push(`${target}${query}`);
    },
    [activeLocale, pathname, router, searchParams]
  );

  return (
    <label className={cn('inline-flex items-center gap-xs text-label text-text', className)} htmlFor={id}>
      <span className="sr-only">{label ?? 'Change language'}</span>
      <select
        id={id}
        aria-label={label ?? 'Change language'}
        className="rounded-2xl border border-border bg-bg px-sm py-xs text-label text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        value={activeLocale}
        onChange={(event) => navigateToLocale(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
