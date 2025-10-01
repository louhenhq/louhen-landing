'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function ConsentNotice() {
  const t = useTranslations('waitlist.consent');

  return (
    <label
      htmlFor="waitlist-consent"
      id="waitlist-consent-help"
      className="text-xs leading-relaxed text-slate-600"
    >
      {t.rich('label', {
        privacy: (chunks) => (
          <Link
            href="/privacy"
            className="font-medium text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4 transition-colors duration-150 hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            {chunks}
          </Link>
        ),
        terms: (chunks) => (
          <Link
            href="/terms"
            className="font-medium text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4 transition-colors duration-150 hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            {chunks}
          </Link>
        ),
      })}
    </label>
  );
}
