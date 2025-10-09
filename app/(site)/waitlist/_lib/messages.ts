import { cookies, headers } from 'next/headers';
import type { AbstractIntlMessages } from 'next-intl';
import { extractLocaleFromCookies, resolveLocale as resolveLocaleValue } from '@/lib/intl/getLocale';
import { loadMessages } from '@/lib/intl/loadMessages';
import deepMerge from '@/lib/utils/deepMerge';
import type { SupportedLocale } from '@/next-intl.locales';
<<<<<<< HEAD
import { LOCALE_COOKIE } from '@/lib/theme/constants';
import waitlistEn from '@/i18n/en/waitlist.json';
import waitlistDe from '@/i18n/de/waitlist.json';

const FALLBACK_LOCALE: SupportedLocale = 'en-de';

const WAITLIST_NAMESPACE: Record<SupportedLocale, AbstractIntlMessages> = {
  'en-de': waitlistEn as AbstractIntlMessages,
  'de-de': waitlistDe as AbstractIntlMessages,
=======
import waitlistEn from '@/i18n/en/waitlist.json';
import waitlistDe from '@/i18n/de/waitlist.json';

const FALLBACK_LOCALE: SupportedLocale = 'en';

const WAITLIST_NAMESPACE: Record<SupportedLocale, AbstractIntlMessages> = {
  en: waitlistEn as AbstractIntlMessages,
  de: waitlistDe as AbstractIntlMessages,
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
};

function selectWaitlistMessages(locale: SupportedLocale): AbstractIntlMessages {
  return WAITLIST_NAMESPACE[locale] ?? WAITLIST_NAMESPACE[FALLBACK_LOCALE];
}

export async function resolveWaitlistLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
<<<<<<< HEAD
  const cookieLocale =
    resolveLocaleValue(cookieStore.get(LOCALE_COOKIE)?.value ?? null) ??
    resolveLocaleValue(cookieStore.get('NEXT_LOCALE')?.value ?? null);
=======
  const cookieLocale = resolveLocaleValue(cookieStore.get('NEXT_LOCALE')?.value ?? null);
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  const headerStore = await headers();
  const headerLocale = extractLocaleFromCookies(headerStore.get('cookie'));
  return cookieLocale ?? headerLocale ?? FALLBACK_LOCALE;
}

export async function loadWaitlistMessages(locale?: SupportedLocale): Promise<{
  locale: SupportedLocale;
  messages: AbstractIntlMessages;
  baseMessages: AbstractIntlMessages;
  waitlistMessages: AbstractIntlMessages;
}> {
  const resolvedLocale = locale ?? (await resolveWaitlistLocale());
  const baseMessages = (await loadMessages(resolvedLocale)) as AbstractIntlMessages;
  const waitlistMessages = selectWaitlistMessages(resolvedLocale);
  const mergedMessages = deepMerge(baseMessages, waitlistMessages);

  return {
    locale: resolvedLocale,
    messages: mergedMessages,
    baseMessages,
    waitlistMessages,
  };
}
