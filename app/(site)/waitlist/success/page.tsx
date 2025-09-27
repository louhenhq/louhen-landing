import Link from 'next/link';
import { createTranslator } from 'next-intl';
import ShareButtons from '@/app/(site)/components/ShareButtons';
import WaitlistSuccessAnalytics from '@/app/(site)/waitlist/_components/WaitlistSuccessAnalytics';
import { loadWaitlistMessages } from '@/app/(site)/waitlist/_lib/messages';

export const dynamic = 'force-dynamic';

export default async function WaitlistSuccessPage() {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });
  const share = t('success.share.heading');

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12 text-slate-800">
      <WaitlistSuccessAnalytics locale={locale} />
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('success.title')}</h1>
      <p className="text-base leading-relaxed text-slate-600">{t('success.subtitle')}</p>

      <Link
        href="/waitlist/pre-onboarding"
        className="inline-flex w-fit items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        {t('success.preOnboarding.cta')}
      </Link>

      <p className="text-sm text-slate-500">{t('success.privacy')}</p>

      <ShareButtons
        title={share}
        buttons={[
          { id: 'copy', label: t('success.share.copy') },
          { id: 'whatsapp', label: t('success.share.whatsapp') },
          { id: 'email', label: t('success.share.email') },
        ]}
      />
    </main>
  );
}
