import type { AbstractIntlMessages } from 'next-intl';
import { getLocaleDefinition, type SupportedLocale } from '@/next-intl.locales';

type MessageLoader = () => Promise<AbstractIntlMessages>;

const messageLoaders: Record<string, MessageLoader> = {
  en: async () => (await import('@/messages/en.json')).default as unknown as AbstractIntlMessages,
  de: async () => (await import('@/messages/de.json')).default as unknown as AbstractIntlMessages,
};

export async function loadMessages(locale: SupportedLocale): Promise<AbstractIntlMessages> {
  const definition = getLocaleDefinition(locale);
  const targetLocale = definition?.messageLocale ?? 'en';
  const loader = messageLoaders[targetLocale] ?? messageLoaders.en;

  try {
    return await loader();
  } catch (error) {
    if (targetLocale !== 'en') {
      return await messageLoaders.en();
    }
    throw error;
  }
}
