import { getRequestConfig } from 'next-intl/server';
import { loadMessages } from '../lib/intl/loadMessages';
import {
  defaultLocale,
  locales,
  normalizeLocale,
  type SupportedLocale,
} from '../next-intl.locales';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = normalizeLocale(await requestLocale) ?? defaultLocale;
  const messages = await loadMessages(locale);
  return {
    locale,
    messages,
  };
});
