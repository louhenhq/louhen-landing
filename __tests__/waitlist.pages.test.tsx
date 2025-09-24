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

const trackSpy = vi.fn();

vi.mock('@/lib/clientAnalytics', () => ({
  track: trackSpy,
}));

const messageMap: Record<MessageLocale, typeof enMessages> = {
  en: enMessages,
  de: deMessages,
};

describe('Waitlist landing pages', () => {
  beforeEach(() => {
    trackSpy.mockReset();
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

  it.each(cases)('renders success page for %s locale and fires analytics', async ({ code, messages }) => {
    locale = code;
    const { default: SuccessPage } = await import('@/app/waitlist/success/page');
    const node = await SuccessPage({ searchParams: Promise.resolve({ status: 'confirmed' }) });
    render(node);

    expect(screen.getByText(messages.waitlist.success.title.confirmed)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(messages.waitlist.success.cta.home, 'i') })).toHaveAttribute('href', `/${code}`);
    expect(trackSpy).toHaveBeenCalledWith({ name: 'waitlist_landing_success_view' });
  });

  it.each(cases)('renders expired page for %s locale and provides CTA', async ({ code, messages }) => {
    locale = code;
    const { default: ExpiredPage } = await import('@/app/waitlist/expired/page');
    const node = await ExpiredPage();
    render(node);

    expect(screen.getByText(messages.waitlist.expired.title)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(messages.waitlist.expired.cta.resend, 'i') })).toHaveAttribute('href', `/${code}#waitlist-form`);
    expect(trackSpy).toHaveBeenCalledWith({ name: 'waitlist_landing_expired_view' });
  });
});
