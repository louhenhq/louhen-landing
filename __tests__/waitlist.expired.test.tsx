import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import enMessages from '@/messages/en.json';

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

describe('/waitlist/expired resend flow', () => {
  beforeEach(() => {
    vi.resetModules();
    trackSpy.mockReset();
    locale = 'en';
  });

  it('submits resend request and shows success message', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })) as unknown as typeof fetch;
    const { default: ExpiredPage } = await import('@/app/waitlist/expired/page');
    const node = await ExpiredPage();
    render(node);

    fireEvent.change(screen.getByLabelText(new RegExp(enMessages.waitlist.resend.email.label, 'i')), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(enMessages.waitlist.resend.submit, 'i') }));

    await screen.findByText(enMessages.waitlist.resend.success);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/waitlist/resend-confirm',
      expect.objectContaining({ method: 'POST' })
    );
    expect(trackSpy).toHaveBeenCalledWith({ name: 'waitlist_resend_requested' });
  });

  it('handles invalid email errors', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ ok: false, code: 'email_required' }),
    })) as unknown as typeof fetch;
    const { default: ExpiredPage } = await import('@/app/waitlist/expired/page');
    const node = await ExpiredPage();
    render(node);

    fireEvent.change(screen.getByLabelText(new RegExp(enMessages.waitlist.resend.email.label, 'i')), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(enMessages.waitlist.resend.submit, 'i') }));
    await screen.findByText(enMessages.waitlist.resend.invalid);
  });
});
