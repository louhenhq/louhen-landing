import { getRequestConfig } from 'next-intl/server';
import { loadMessages } from './lib/intl/loadMessages';
import {
  locales,
  defaultLocale,
  normalizeLocale,
  type SupportedLocale,
} from './next-intl.locales';

export default getRequestConfig(async ({ locale }) => {
  const activeLocale = normalizeLocale(locale) ?? defaultLocale;
  const messages = await loadMessages(activeLocale);
  return {
    locale: activeLocale,
    messages,
  };
});

export const config = {
  locales,
  defaultLocale,
};
