import Link from 'next/link';
import { createTranslator } from 'next-intl';
import { loadWaitlistMessages } from '@/app/(site)/waitlist/_lib/messages';
import { readWaitlistSession } from '@/lib/waitlist/session';
import { hasPreOnboarded } from '@/lib/firestore/waitlist';

export const dynamic = 'force-dynamic';

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
          href="/waitlist/pre-onboarding"
          className="inline-flex w-fit items-center justify-center rounded-2xl bg-brand-primary px-lg py-sm text-label text-brand-onPrimary transition-opacity duration-base hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          {t('success.preOnboarding.cta')}
        </Link>
      )}
    </main>
  );
}
