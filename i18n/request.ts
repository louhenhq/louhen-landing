import { getRequestConfig } from 'next-intl/server';
import { loadMessages } from '../lib/intl/loadMessages';
import { defaultLocale, locales, type SupportedLocale } from '../next-intl.locales';

function resolveLocale(input?: string | null): SupportedLocale {
  if (input && locales.includes(input as SupportedLocale)) {
    return input as SupportedLocale;
  }
  return defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = resolveLocale(await requestLocale);
  const messages = await loadMessages(locale);
  return {
    locale,
    messages,
  };
});
