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
    </main>
  );
}
