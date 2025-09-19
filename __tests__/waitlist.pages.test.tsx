import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import enMessages from '@/messages/en.json';
import deMessages from '@/messages/de.json';

let locale: 'en' | 'de' | null = 'en';

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: () => (locale ? { value: locale } : undefined),
  }),
  headers: () => ({
    get: () => (locale ? `NEXT_LOCALE=${locale}` : null),
  }),
}));

const trackSpy = vi.fn();

vi.mock('@/lib/clientAnalytics', () => ({
  track: trackSpy,
}));

describe('Waitlist landing pages', () => {
  beforeEach(() => {
    trackSpy.mockReset();
    locale = 'en';
  });

  const cases: Array<{ code: 'en' | 'de'; messages: any }> = [
    { code: 'en', messages: enMessages },
    { code: 'de', messages: deMessages },
  ];

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
