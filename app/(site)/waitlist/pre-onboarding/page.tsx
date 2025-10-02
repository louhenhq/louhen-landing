import type { Metadata } from 'next';
import Link from 'next/link';
import { createTranslator } from 'next-intl';
import PreOnboardingForm from '@/app/(site)/waitlist/pre-onboarding/_components/PreOnboardingForm';
import { loadWaitlistMessages } from '@/app/(site)/waitlist/_lib/messages';
import { readWaitlistSession } from '@/lib/waitlist/session';
import { getPreOnboardingDraft, hasPreOnboarded } from '@/lib/firestore/waitlist';
import { cn } from '@/app/(site)/_lib/ui';
import { buildPathForLocale } from '@/lib/i18n/locales';
import {
  buildAlternateLanguageMap,
  buildCanonicalPath,
} from '@/lib/i18n/metadata';

export const dynamic = 'force-dynamic';

const PAGE_PATH = '/waitlist/pre-onboarding/';

export async function generateMetadata(): Promise<Metadata> {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'preonboarding' });
  const languages = buildAlternateLanguageMap(PAGE_PATH);

  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: buildCanonicalPath(locale, PAGE_PATH),
      languages,
    },
  };
}

export default async function WaitlistPreOnboardingPage() {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'preonboarding' });
  const tWaitlist = createTranslator({ locale, messages, namespace: 'waitlist' });
  const sessionId = await readWaitlistSession();
  const canSubmit = Boolean(sessionId);
  const draft = canSubmit ? await getPreOnboardingDraft(sessionId!) : null;
  const preOnboarded = draft ? true : canSubmit ? await hasPreOnboarded(sessionId!) : false;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-lg px-md py-xl text-text">
      <header className="max-w-2xl space-y-sm">
        <span className="inline-flex items-center gap-xs rounded-full border border-feedback-success-border bg-feedback-success-surface px-sm py-4 text-meta font-medium uppercase tracking-[0.24em] text-feedback-success">
          {t('badge')}
        </span>
        <h1 className="text-display-lg text-text">{t('title')}</h1>
        <p className="text-body text-text-muted">{t('subtitle')}</p>
      </header>

      <div className="grid gap-md rounded-2xl border border-border bg-bg-card px-md py-lg shadow-card">
        {preOnboarded ? (
          <div className="space-y-sm" role="status">
            <div className="rounded-2xl border border-feedback-success-border bg-feedback-success-surface px-sm py-sm text-body-sm text-feedback-success">
              {t('status.completed')}
            </div>
            <p className="text-body-sm text-text-muted">{t('status.editHint')}</p>
            <PreOnboardingForm canSubmit={canSubmit} initialDraft={draft || undefined} />
          </div>
        ) : canSubmit ? (
          <PreOnboardingForm canSubmit={canSubmit} initialDraft={draft || undefined} />
        ) : (
          <div className="space-y-sm" role="alert">
            <div className="rounded-2xl border border-feedback-warning-border bg-feedback-warning-surface px-sm py-sm text-body-sm text-feedback-warning">
              {t('errors.session')}
            </div>
            <Link
              href={buildPathForLocale(locale, '/waitlist/')}
              className="inline-flex w-fit items-center justify-center rounded-2xl bg-brand-primary px-lg py-sm text-label text-brand-onPrimary transition-opacity duration-base hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            >
              {t('actions.returnToWaitlist')}
            </Link>
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-dashed border-border bg-bg px-md py-md text-body text-text-muted">
        <h2 className="text-h3 text-text">{t('incentive.title')}</h2>
        <p className="mt-xs text-body text-text-muted">{t('incentive.body')}</p>
        <p className={cn('mt-sm text-meta text-text-muted uppercase tracking-[0.24em]')}>{t('privacy.label')}</p>
        <p className="text-body text-text-muted">{t('privacy.body')}</p>
      </section>

      <div>
        <Link
          href={buildPathForLocale(locale, '/waitlist/success/')}
          className="inline-flex w-fit items-center justify-center rounded-2xl bg-brand-primary px-lg py-sm text-label text-brand-onPrimary transition-opacity duration-base hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          {tWaitlist('success.return')}
        </Link>
      </div>
    </main>
  );
}
