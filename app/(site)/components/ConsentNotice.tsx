'use client';

import Link from 'next/link';
<<<<<<< HEAD
import { useTranslations, useLocale } from 'next-intl';
import { buildPathForLocale, DEFAULT_LOCALE, FULL_LOCALES, type AppLocale } from '@/lib/i18n/locales';

export default function ConsentNotice() {
  const t = useTranslations('waitlist.consent');
  const rawLocale = useLocale();
  const activeLocale = (FULL_LOCALES.includes(rawLocale as AppLocale) ? (rawLocale as AppLocale) : DEFAULT_LOCALE.value) as AppLocale;
  const to = (pathname: string) => buildPathForLocale(activeLocale, pathname);

  return (
    <label
      htmlFor="waitlist-consent"
      id="waitlist-consent-help"
      className="text-body-sm leading-relaxed text-text-muted"
    >
      {t.rich('label', {
        privacy: (chunks) => (
          <Link
            href={to('/privacy')}
            className="font-medium text-text underline decoration-brand-primary decoration-2 underline-offset-4 transition-colors duration-150 hover:text-feedback-success focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
=======
import { useTranslations } from 'next-intl';

export default function ConsentNotice() {
  const t = useTranslations('waitlist.consent');

  return (
    <p id="waitlist-consent-help" className="text-xs leading-relaxed text-slate-600">
      {t.rich('label', {
        privacy: (chunks) => (
          <Link
            href="/privacy"
            className="font-medium text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4 transition-colors duration-150 hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
          >
            {chunks}
          </Link>
        ),
        terms: (chunks) => (
          <Link
<<<<<<< HEAD
            href={to('/terms')}
            className="font-medium text-text underline decoration-brand-primary decoration-2 underline-offset-4 transition-colors duration-150 hover:text-feedback-success focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
=======
            href="/terms"
            className="font-medium text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4 transition-colors duration-150 hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
          >
            {chunks}
          </Link>
        ),
      })}
<<<<<<< HEAD
    </label>
=======
    </p>
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  );
}
