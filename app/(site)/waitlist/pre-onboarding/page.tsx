import Link from 'next/link';
import { createTranslator } from 'next-intl';
import PreOnboardingForm from '@/app/(site)/waitlist/pre-onboarding/_components/PreOnboardingForm';
import { loadWaitlistMessages } from '@/app/(site)/waitlist/_lib/messages';
import { getWaitlistSession } from '@/lib/waitlist/session';
import { getPreOnboardingDraft, hasPreOnboarded } from '@/lib/firestore/waitlist';

export const dynamic = 'force-dynamic';

export default async function WaitlistPreOnboardingPage() {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'preonboarding' });
  const tWaitlist = createTranslator({ locale, messages, namespace: 'waitlist' });
  const sessionId = getWaitlistSession();
  const canSubmit = Boolean(sessionId);
  const draft = canSubmit ? await getPreOnboardingDraft(sessionId!) : null;
  const preOnboarded = draft ? true : canSubmit ? await hasPreOnboarded(sessionId!) : false;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 text-slate-800">
      <header className="max-w-2xl space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700">
          {t('badge')}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
        <p className="text-base text-slate-600">{t('subtitle')}</p>
      </header>

      <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-lg">
        {preOnboarded ? (
          <div className="space-y-4" role="status">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {t('status.completed')}
            </div>
            <p className="text-sm text-slate-600">{t('status.editHint')}</p>
            <PreOnboardingForm canSubmit={canSubmit} initialDraft={draft || undefined} />
          </div>
        ) : canSubmit ? (
          <PreOnboardingForm canSubmit={canSubmit} initialDraft={draft || undefined} />
        ) : (
          <div className="space-y-4" role="alert">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {t('errors.session')}
            </div>
            <Link
              href="/waitlist"
              className="inline-flex w-fit items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              {t('actions.returnToWaitlist')}
            </Link>
          </div>
        )}
      </div>

      <section className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-6 text-sm text-slate-600">
        <h2 className="text-base font-semibold text-slate-900">{t('incentive.title')}</h2>
        <p className="mt-2 text-sm text-slate-600">{t('incentive.body')}</p>
        <p className="mt-4 text-xs uppercase tracking-wide text-slate-500">{t('privacy.label')}</p>
        <p className="text-sm text-slate-500">{t('privacy.body')}</p>
      </section>

      <div>
        <Link
          href="/waitlist/success"
          className="inline-flex w-fit items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          {tWaitlist('success.return')}
        </Link>
      </div>
    </main>
  );
}
