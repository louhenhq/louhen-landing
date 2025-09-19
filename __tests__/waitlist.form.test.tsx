import React from 'react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/messages/en.json';

const trackSpy = vi.fn();

vi.mock('@/lib/clientAnalytics', () => ({
  track: trackSpy,
}));

describe('WaitlistForm (marketing)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_HCAPTCHA_SITE_KEY', '');
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('submits when consented and shows success feedback', async () => {
    const { default: WaitlistForm } = await import('@/components/waitlist/WaitlistForm');

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <WaitlistForm source="unit-test" />
      </NextIntlClientProvider>
    );

    const submit = screen.getByRole('button', { name: /join waitlist/i });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'tester@example.com' } });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/I agree to receive waitlist updates/i));
    expect(submit).not.toBeDisabled();

    fireEvent.click(submit);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/waitlist',
      expect.objectContaining({ method: 'POST' })
    );

    await screen.findByText(/Check your inbox/i);

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'waitlist_signup_submitted' })
    );
    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'waitlist_signup_result', ok: true })
    );
  });
});
