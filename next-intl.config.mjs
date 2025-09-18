import { getRequestConfig } from 'next-intl/server';

const envLocales = (process.env.NEXT_PUBLIC_LOCALES ?? 'en,de')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const locales = envLocales.length ? envLocales : ['en', 'de'];
const envDefaultLocale = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en').trim();
const defaultLocale = locales.includes(envDefaultLocale) ? envDefaultLocale : locales[0];

function resolveLocale(locale) {
  if (typeof locale === 'string' && locales.includes(locale)) {
    return locale;
  }
  return defaultLocale;
}

export default getRequestConfig(async ({ locale }) => {
  const activeLocale = resolveLocale(locale);
  const messages = (await import(`./messages/${activeLocale}.json`)).default;
  return {
    locale: activeLocale,
    messages,
  };
});

export const config = {
  locales,
  defaultLocale,
};
