import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import { ConsentProvider } from '@/components/ConsentProvider';
import { loadMessages } from '@/lib/intl/loadMessages';
import { type SupportedLocale } from '@/next-intl.locales';
import { parseConsentFromCookie } from '@/lib/shared/consent/api';

export const runtime = 'nodejs';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

const SUPPORTED_LOCALES: readonly SupportedLocale[] = ['de-de', 'en-de', 'fr-fr', 'nl-nl', 'it-it'];
const SUPPORTED_LOCALE_SET = new Set<SupportedLocale>(SUPPORTED_LOCALES);

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: rawLocale } = await params;
  if (!SUPPORTED_LOCALE_SET.has(rawLocale as SupportedLocale)) {
    notFound();
  }
  const locale = rawLocale as SupportedLocale;
  unstable_setRequestLocale(locale);
  const messages = await loadMessages(locale);
  const requestHeaders = await headers();
  const consentState = parseConsentFromCookie(requestHeaders.get('cookie'));
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      <ConsentProvider initialState={consentState}>
        {children}
      </ConsentProvider>
    </NextIntlClientProvider>
  );
}
