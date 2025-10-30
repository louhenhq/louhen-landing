'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { DEFAULT_LOCALE, FULL_LOCALES, type AppLocale } from '@/lib/i18n/locales';
import { legalPath } from '@lib/shared/routing/legal-path';

export default function ConsentNotice() {
  const t = useTranslations('waitlist.consent');
  const rawLocale = useLocale();
  const activeLocale = (FULL_LOCALES.includes(rawLocale as AppLocale) ? (rawLocale as AppLocale) : DEFAULT_LOCALE.value) as AppLocale;
  const privacyHref = legalPath(activeLocale, 'privacy');
  const termsHref = legalPath(activeLocale, 'terms');

  return (
    <label
      htmlFor="waitlist-consent"
      id="waitlist-consent-help"
      className="text-body-sm leading-relaxed text-text-muted"
    >
      {t.rich('label', {
        privacy: (chunks) => (
          <Link
            href={privacyHref}
            className="font-medium text-text underline decoration-brand-primary decoration-2 underline-offset-4 transition-colors duration-150 hover:text-feedback-success focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            {chunks}
          </Link>
        ),
        terms: (chunks) => (
          <Link
            href={termsHref}
            className="font-medium text-text underline decoration-brand-primary decoration-2 underline-offset-4 transition-colors duration-150 hover:text-feedback-success focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            {chunks}
          </Link>
        ),
      })}
    </label>
  );
}
