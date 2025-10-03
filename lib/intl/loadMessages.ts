import type { AbstractIntlMessages } from 'next-intl';
import type { SupportedLocale } from '@/next-intl.locales';

export async function loadMessages(locale: SupportedLocale): Promise<AbstractIntlMessages> {
  switch (locale) {
    case 'de-de':
      return (await import('@/messages/de.json')).default as unknown as AbstractIntlMessages;
    case 'en-de':
    default:
      return (await import('@/messages/en.json')).default as unknown as AbstractIntlMessages;
  }
}
