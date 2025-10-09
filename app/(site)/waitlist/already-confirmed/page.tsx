<<<<<<< HEAD
import type { Metadata } from 'next';
import Link from 'next/link';
import { createTranslator } from 'next-intl';
import { loadWaitlistMessages } from '@/app/(site)/waitlist/_lib/messages';
import { readWaitlistSession } from '@/lib/waitlist/session';
import { hasPreOnboarded } from '@/lib/firestore/waitlist';
import { buildPathForLocale } from '@/lib/i18n/locales';
import {
  buildAlternateLanguageMap,
  buildCanonicalPath,
} from '@/lib/i18n/metadata';

export const dynamic = 'force-dynamic';

const PAGE_PATH = '/waitlist/already-confirmed/';

export async function generateMetadata(): Promise<Metadata> {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });
  const title = t('already.title');
  const description = t('already.subtitle');
  const languages = buildAlternateLanguageMap(PAGE_PATH);

  return {
    title,
    description,
    alternates: {
      canonical: buildCanonicalPath(locale, PAGE_PATH),
      languages,
    },
  };
}

export default async function WaitlistAlreadyConfirmedPage() {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });
  const sessionId = await readWaitlistSession();
  const preOnboarded = sessionId ? await hasPreOnboarded(sessionId) : false;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-sm px-md py-xl text-text">
      <h1 className="text-display-lg text-balance text-text">{t('already.title')}</h1>
      <p className="text-body text-text-muted">{t('already.subtitle')}</p>
      {preOnboarded ? (
        <p
          className="rounded-2xl border border-feedback-success-border bg-feedback-success-surface px-sm py-sm text-body-sm text-feedback-success"
          role="status"
        >
          {t('success.preOnboarding.completed')}
        </p>
      ) : (
        <Link
          href={buildPathForLocale(locale, '/waitlist/pre-onboarding/')}
          className="inline-flex w-fit items-center justify-center rounded-2xl bg-brand-primary px-lg py-sm text-label text-brand-onPrimary transition-opacity duration-base hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          {t('success.preOnboarding.cta')}
        </Link>
      )}
=======
import Link from 'next/link';
import { createTranslator } from 'next-intl';
import { loadWaitlistMessages } from '@/app/(site)/waitlist/_lib/messages';

export const dynamic = 'force-dynamic';

export default async function WaitlistAlreadyConfirmedPage() {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-12 text-slate-800">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('already.title')}</h1>
      <p className="text-base text-slate-600">{t('already.subtitle')}</p>
      <Link
        href="/waitlist/pre-onboarding"
        className="inline-flex w-fit items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        {t('success.preOnboarding.cta')}
      </Link>
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
    </main>
  );
}
