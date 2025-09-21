import type { ReactNode } from 'react';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
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

const SUPPORTED_LOCALES = new Set<SupportedLocale>(locales);
const FALLBACK_LOCALE: SupportedLocale = 'en';

function isMessagesObject(value: unknown): value is AbstractIntlMessages {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: rawLocale } = await params;
  let resolvedLocale: SupportedLocale = SUPPORTED_LOCALES.has(rawLocale) ? rawLocale : FALLBACK_LOCALE;

  let messages: AbstractIntlMessages | null = null;

  try {
    const loaded = await loadMessages(resolvedLocale);
    if (isMessagesObject(loaded)) {
      messages = loaded;
    }
  } catch {
    messages = null;
  }

  if (!messages) {
    resolvedLocale = FALLBACK_LOCALE;
    try {
      const fallbackMessages = await loadMessages(FALLBACK_LOCALE);
      if (isMessagesObject(fallbackMessages)) {
        messages = fallbackMessages;
      }
    } catch {
      messages = {};
    }
  }

  const resolvedMessages: AbstractIntlMessages = messages ?? {};

  return (
    <NextIntlClientProvider locale={resolvedLocale} messages={resolvedMessages} timeZone="UTC">
      <ConsentProvider>
        {children}
      </ConsentProvider>
    </NextIntlClientProvider>
  );
}
