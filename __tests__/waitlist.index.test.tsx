import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import enMessages from '@/messages/en.json';
import deMessages from '@/messages/de.json';
import { LOCALE_COOKIE, getLocaleDefinition, type MessageLocale, type SupportedLocale } from '@/next-intl.locales';

let locale: SupportedLocale | null = 'en-eu';

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: () => (locale ? { value: locale } : undefined),
  }),
  headers: () => ({
    get: (key: string) => (key.toLowerCase() === 'cookie' && locale ? `${LOCALE_COOKIE}=${locale}` : null),
  }),
}));

const messageMap: Record<MessageLocale, typeof enMessages> = {
  en: enMessages,
  de: deMessages,
};

describe('/waitlist index page', () => {
  beforeEach(() => {
    vi.resetModules();
    locale = 'en-eu';
  });

  const localesToTest: SupportedLocale[] = ['en-eu', 'de-de'];
  const cases = localesToTest.map((code) => {
    const definition = getLocaleDefinition(code);
    if (!definition) {
      throw new Error(`Test locale ${code} missing definition`);
    }
    return {
      code,
      messages: messageMap[definition.messageLocale] ?? enMessages,
    };
  });

  it.each(cases)('renders localized content for %s', async ({ code, messages }) => {
    locale = code;
    const { default: WaitlistIndexPage } = await import('@/app/waitlist/page');
    const node = await WaitlistIndexPage();
    render(node);

    expect(screen.getByText(messages.waitlist.index.title)).toBeInTheDocument();
    const joinLink = screen.getByRole('link', { name: new RegExp(messages.waitlist.index.cta.join, 'i') });
    expect(joinLink).toHaveAttribute('href', `/${code}#waitlist-form`);
    expect(screen.getByRole('link', { name: new RegExp(messages.waitlist.index.cta.privacy, 'i') })).toHaveAttribute('href', `/${code}/privacy`);
    expect(screen.getByRole('link', { name: new RegExp(messages.waitlist.index.cta.faq, 'i') })).toHaveAttribute('href', `/${code}#faq`);
  });
});
