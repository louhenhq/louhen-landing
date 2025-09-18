import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { loadMessages } from '@/lib/intl/loadMessages';
import { locales, type SupportedLocale } from '@/next-intl.locales';
import { ConsentProvider } from '@/app/(site)/components/ConsentProvider';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: SupportedLocale }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  const messages = await loadMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <ConsentProvider>
        {children}
      </ConsentProvider>
    </NextIntlClientProvider>
  );
}
