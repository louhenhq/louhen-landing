'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/app/(site)/_lib/ui';
import {
  SUPPORTED_LOCALES,
  buildLocaleCookie,
  buildPathForLocale,
  type AppLocale,
} from '@/lib/i18n/locales';

type SuggestionReason = 'cookie' | 'accept-language';

type Props = {
  targetLocale: AppLocale;
  reason: SuggestionReason;
};

export default function LocaleSuggestion({ targetLocale, reason }: Props) {
  const [visible, setVisible] = useState(true);
  const t = useTranslations('localeSuggestion');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const descriptor = useMemo(() => SUPPORTED_LOCALES.find((entry) => entry.value === targetLocale), [targetLocale]);

  if (!visible || !descriptor) {
    return null;
  }

  const message =
    reason === 'cookie'
      ? t('body.cookie', { locale: descriptor.nativeName })
      : t('body.acceptLanguage', { locale: descriptor.nativeName });

  function handleSwitch() {
    const params = searchParams?.toString();
    const query = params ? `?${params}` : '';
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const currentPath = pathname || '/';
    const targetPath = buildPathForLocale(targetLocale, currentPath);
    const cookie = buildLocaleCookie(targetLocale);
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${cookie}${secure}`;
    const destination = `${targetPath}${query}${hash}`;
    const shouldScroll = hash.length === 0;
    router.push(destination, { scroll: shouldScroll });
  }

  return (
    <aside
      className="mx-auto mb-lg w-full max-w-6xl rounded-2xl border border-border bg-bg px-md py-sm shadow-lg"
      aria-live="polite"
    >
      <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2xs text-text">
          <span className="text-label font-semibold">
            {t('title', { locale: descriptor.nativeName })}
          </span>
          <p className="max-w-2xl text-body-sm text-text-muted">{message}</p>
        </div>
        <div className="flex flex-col gap-xs sm:flex-row">
          <button
            type="button"
            onClick={handleSwitch}
            className={cn(
              'inline-flex items-center justify-center rounded-2xl bg-text px-md py-sm text-label text-bg',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus'
            )}
          >
            {t('action', { locale: descriptor.nativeName })}
          </button>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className={cn(
              'inline-flex items-center justify-center rounded-2xl border border-border px-md py-sm text-label text-text',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus'
            )}
          >
            {t('dismiss')}
          </button>
        </div>
      </div>
    </aside>
  );
}
