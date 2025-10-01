'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function ConsentNotice() {
  const t = useTranslations('waitlist.consent');

  return (
    <label
      htmlFor="waitlist-consent"
      id="waitlist-consent-help"
      className="text-body-sm leading-relaxed text-text-muted"
    >
      {t.rich('label', {
        privacy: (chunks) => (
          <Link
            href="/privacy"
            className="font-medium text-text underline decoration-brand-primary decoration-2 underline-offset-4 transition-colors duration-150 hover:text-feedback-success focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            {chunks}
          </Link>
        ),
        terms: (chunks) => (
          <Link
            href="/terms"
            className="font-medium text-text underline decoration-brand-primary decoration-2 underline-offset-4 transition-colors duration-150 hover:text-feedback-success focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            {chunks}
          </Link>
        ),
      })}
    </label>
  );
}
