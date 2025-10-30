import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './next-intl.locales';

function resolveLocale(locale) {
  if (typeof locale === 'string') {
    const normalized = locale.toLowerCase();
    if (locales.includes(normalized)) {
      return normalized;
    }
  }
  return defaultLocale;
}

export default getRequestConfig(async ({ locale }) => {
  const activeLocale = resolveLocale(locale);
  const { loadMessages } = await import('./lib/intl/loadMessages');
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
