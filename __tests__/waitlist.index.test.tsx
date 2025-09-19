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

describe('/waitlist index page', () => {
  beforeEach(() => {
    vi.resetModules();
    locale = 'en';
  });

  const cases: Array<{ code: 'en' | 'de'; messages: any }> = [
    { code: 'en', messages: enMessages },
    { code: 'de', messages: deMessages },
  ];

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
