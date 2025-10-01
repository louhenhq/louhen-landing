import { createTranslator } from 'next-intl';
import ExpiredResendForm from '@/app/(site)/waitlist/_components/ExpiredResendForm';
import { loadWaitlistMessages } from '@/app/(site)/waitlist/_lib/messages';
import { getWaitlistConfirmTtlDays } from '@/lib/waitlistConfirmTtl';

export const dynamic = 'force-dynamic';

export default async function WaitlistExpiredPage() {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });
  const ttlDays = getWaitlistConfirmTtlDays();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-sm px-md py-xl text-text">
      <h1 className="text-display-lg text-text">{t('expired.title')}</h1>
      <p className="text-body text-text-muted">{t('expired.subtitle')}</p>
      <ExpiredResendForm ttlDays={ttlDays} />
    </main>
  );
}
