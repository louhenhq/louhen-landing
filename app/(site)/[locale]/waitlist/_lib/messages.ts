import { cookies, headers } from 'next/headers';
import type { AbstractIntlMessages } from 'next-intl';
import { extractLocaleFromCookies, resolveLocale as resolveLocaleValue } from '@/lib/intl/getLocale';
import { loadMessages } from '@/lib/intl/loadMessages';
import type { SupportedLocale } from '@/next-intl.locales';

const WAITLIST_FALLBACK_LOCALE: SupportedLocale = 'de-de';

export async function resolveWaitlistLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const cookieLocale = resolveLocaleValue(cookieStore.get('NEXT_LOCALE')?.value ?? null);
  const headerStore = await headers();
  const headerLocale = extractLocaleFromCookies(headerStore.get('cookie'));
  return cookieLocale ?? headerLocale ?? WAITLIST_FALLBACK_LOCALE;
}

export async function loadWaitlistMessages(locale?: SupportedLocale): Promise<{
  locale: SupportedLocale;
  messages: AbstractIntlMessages;
  baseMessages: AbstractIntlMessages;
}> {
  const resolvedLocale = locale ?? (await resolveWaitlistLocale());
  const baseMessages = (await loadMessages(resolvedLocale)) as AbstractIntlMessages;

  return {
    locale: resolvedLocale,
    messages: baseMessages,
    baseMessages,
  };
}
