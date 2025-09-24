'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import {
  locales,
  defaultLocale,
  getLocaleDefinition,
  buildLocalePath,
  type SupportedLocale,
} from '@/next-intl.locales';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const locale = useLocale();
  const activeLocale: SupportedLocale = locales.includes(locale as SupportedLocale)
    ? (locale as SupportedLocale)
    : defaultLocale;
  const localeDefinition = getLocaleDefinition(activeLocale);
  const isGerman = localeDefinition?.language === 'de';

  const helpTranslations = useTranslations('help');
  const guidesTranslations = useTranslations('guides.hero');

  const homeLabel = isGerman ? 'Startseite' : 'Home';
  const heading = isGerman ? 'Etwas ist schiefgelaufen' : 'Something went wrong';
  const body = isGerman
    ? 'Bitte versuche es erneut oder kehre zur Startseite zurück.'
    : 'Please try again or head back to the home page.';
  const retryLabel = isGerman ? 'Erneut versuchen' : 'Try again';
  const helpLabel = helpTranslations('navLabel');
  const guidesLabel = guidesTranslations('title');

  const homeHref = buildLocalePath(activeLocale);
  const helpHref = buildLocalePath(activeLocale, '/help');
  const guidesHref = buildLocalePath(activeLocale, '/guides');

  return (
    <html lang={activeLocale}>
      <body className="bg-bg text-text">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-6 px-6 py-16">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{heading}</h1>
            <p className="mt-3 text-base text-slate-600">{body}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <Link className="text-brand-primary hover:underline" href={homeHref} prefetch={false}>
              {homeLabel}
            </Link>
            <Link className="text-brand-primary hover:underline" href={helpHref} prefetch={false}>
              {helpLabel}
            </Link>
            <Link className="text-brand-primary hover:underline" href={guidesHref} prefetch={false}>
              {guidesLabel}
            </Link>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-bg-card"
          >
            {retryLabel}
          </button>
        </main>
      </body>
    </html>
  );
}
