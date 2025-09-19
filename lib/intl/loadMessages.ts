import type { AbstractIntlMessages } from 'next-intl';
import type { SupportedLocale } from '@/next-intl.locales';

export async function loadMessages(locale: SupportedLocale): Promise<AbstractIntlMessages> {
  switch (locale) {
    case 'de':
      return (await import('@/messages/de.json')).default as unknown as AbstractIntlMessages;
    case 'en':
    default:
      return (await import('@/messages/en.json')).default as unknown as AbstractIntlMessages;
  }
}
