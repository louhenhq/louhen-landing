import { getRequestConfig } from 'next-intl/server';

const locales = ['en-de', 'de-de', 'fr-fr', 'nl-nl', 'it-it'];
const defaultLocale = 'de-de';

const messageKeyByLocale = new Map([
  ['en-de', 'en'],
  ['de-de', 'de'],
  ['fr-fr', 'fr'],
  ['nl-nl', 'nl'],
  ['it-it', 'it'],
]);

function resolveLocale(locale) {
  if (typeof locale === 'string') {
    const normalized = locale.toLowerCase();
    if (locales.includes(normalized)) {
      return normalized;
    }
  }
  return defaultLocale;
}

function resolveMessageKey(locale) {
  return messageKeyByLocale.get(locale) ?? messageKeyByLocale.get(defaultLocale) ?? 'en';
}

export default getRequestConfig(async ({ locale }) => {
  const activeLocale = resolveLocale(locale);
  const messageKey = resolveMessageKey(activeLocale);
  const messages = (await import(`./messages/${messageKey}.json`)).default;
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
