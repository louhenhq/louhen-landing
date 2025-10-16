import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { loadWaitlistMessages } from '@/app/(site)/[locale]/waitlist/_lib/messages';
import type { SupportedLocale } from '@/next-intl.locales';

export default async function WaitlistLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: SupportedLocale };
}) {
  const { locale, messages } = await loadWaitlistMessages(params.locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}
