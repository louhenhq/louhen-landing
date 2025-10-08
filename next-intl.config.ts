import { getRequestConfig } from 'next-intl/server';
import { loadMessages } from './lib/intl/loadMessages';
import { locales, defaultLocale, type SupportedLocale } from './next-intl.locales';

function resolveLocale(input?: string | null): SupportedLocale {
  if (input && locales.includes(input as SupportedLocale)) {
    return input as SupportedLocale;
  }
  return defaultLocale;
}

export default getRequestConfig(async ({ locale }) => {
  const activeLocale = resolveLocale(locale);
  const messages = await loadMessages(activeLocale);
  return {
    locale: activeLocale,
    messages,
  };
});

export const config = {
  locales,
  defaultLocale,
  localePrefix: 'always',
};
