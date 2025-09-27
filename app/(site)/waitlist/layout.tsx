import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { loadWaitlistMessages } from '@/app/(site)/waitlist/_lib/messages';

export default async function WaitlistLayout({ children }: { children: ReactNode }) {
  const { locale, messages } = await loadWaitlistMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}
