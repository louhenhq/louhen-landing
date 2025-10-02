'use client';

import { useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/app/(site)/_lib/ui';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  isSupportedLocale,
  buildPathForLocale,
  buildLocaleCookie,
  type AppLocale,
} from '@/lib/i18n/locales';

type LocaleOption = {
  value: AppLocale;
  label: string;
};

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
  const [announcement, setAnnouncement] = useState('');

  const activeLocale: AppLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE.value;

  const options: LocaleOption[] = useMemo(
    () =>
      SUPPORTED_LOCALES.map((entry) => ({
        value: entry.value,
        label: entry.nativeName,
      })),
    []
  );

  const navigateToLocale = useCallback(
    (nextLocale: string) => {
      if (nextLocale === activeLocale) return;
      if (!isSupportedLocale(nextLocale)) return;

      const params = searchParams?.toString();
      const query = params ? `?${params}` : '';
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const targetPath = buildPathForLocale(nextLocale, pathname);
      const serialized = buildLocaleCookie(nextLocale);
      const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${serialized}${secure}`;
      const message = t('announce', { locale: options.find((opt) => opt.value === nextLocale)?.label ?? nextLocale });
      setAnnouncement(message);
      const destination = `${targetPath}${query}${hash}`;
      const shouldScroll = hash.length === 0;
      router.push(destination, { scroll: shouldScroll });
    },
    [activeLocale, pathname, router, searchParams, options, t]
  );

  useEffect(() => {
    setAnnouncement('');
  }, []);

  return (
    <label className={cn('inline-flex items-center gap-xs text-label text-text', className)} htmlFor={id}>
      <span className="sr-only">{label ?? t('label')}</span>
      <select
        id={id}
        aria-label={label ?? t('label')}
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
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </label>
  );
}
