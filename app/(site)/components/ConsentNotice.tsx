'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { legalPath } from '@/lib/routing/legalPath';

export default function ConsentNotice() {
  const t = useTranslations('waitlist.consent');
  const locale = useLocale();

  return (
    <p id="waitlist-consent-help" className="text-xs leading-relaxed text-slate-600">
      {t.rich('label', {
        privacy: (chunks) => (
          <Link
            href={legalPath(locale, 'privacy')}
            className="font-medium text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4 transition-colors duration-150 hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            {chunks}
          </Link>
        ),
        terms: (chunks) => (
          <Link
            href={legalPath(locale, 'terms')}
            className="font-medium text-slate-900 underline decoration-emerald-500 decoration-2 underline-offset-4 transition-colors duration-150 hover:text-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}
