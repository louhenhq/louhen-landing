import { describe, expect, it } from 'vitest';
import enMessages from '@/messages/en.json';
import deMessages from '@/messages/de.json';
import { localeDefinitions, type MessageLocale } from '@/next-intl.locales';

const messageMap: Record<MessageLocale, typeof enMessages> = {
  en: enMessages,
  de: deMessages,
};

const requiredPaths = [
  'waitlist.index.title',
  'waitlist.index.body',
  'waitlist.index.cta.join',
  'waitlist.index.cta.privacy',
  'waitlist.index.cta.faq',
  'waitlist.success.title.pending',
  'waitlist.success.title.confirmed',
  'waitlist.success.body.pending',
  'waitlist.success.body.confirmed',
  'waitlist.success.cta.home',
  'waitlist.success.cta.preferences',
  'waitlist.expired.title',
  'waitlist.expired.body',
  'waitlist.expired.cta.resend',
  'waitlist.resend.email.label',
  'waitlist.resend.submit',
  'waitlist.resend.success',
  'waitlist.resend.error',
  'waitlist.toast.confirmed.title',
  'waitlist.toast.confirmed.body',
];

function getPathValue(obj: any, path: string) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

describe('waitlist i18n completeness', () => {
  const testedLocales = localeDefinitions.map((definition) => ({
    code: definition.locale,
    messages: messageMap[definition.messageLocale] ?? enMessages,
  }));

  it('provides required keys for each locale', () => {
    for (const { code, messages } of testedLocales) {
      for (const path of requiredPaths) {
        const value = getPathValue(messages, path);
        expect(value, `${code} missing ${path}`).toBeDefined();
        if (typeof value === 'string') {
          expect(value.trim().length, `${code} empty ${path}`).toBeGreaterThan(0);
        }
      }
    }
  });
});
