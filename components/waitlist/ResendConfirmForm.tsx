'use client';

import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { buttons, cn, layout, text } from '@/app/(site)/_lib/ui';
import { track } from '@/lib/clientAnalytics';

export type ResendConfirmStrings = {
  title: string;
  description: string;
  email: {
    label: string;
    placeholder: string;
  };
  submit: string;
  success: string;
  error: string;
  rateLimited: string;
  invalid: string;
};

type ResendConfirmFormProps = {
  strings: ResendConfirmStrings;
};

type Status = 'idle' | 'loading' | 'success' | 'error';

export function ResendConfirmForm({ strings }: ResendConfirmFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || status === 'loading') return;

    setStatus('loading');
    setMessage('');
    track({ name: 'waitlist_resend_requested' });

    try {
      const response = await fetch('/api/waitlist/resend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), hcaptchaToken: 'dev-bypass' }),
      });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 429) {
        setStatus('error');
        setMessage(strings.rateLimited);
        return;
      }
      if (response.status === 400) {
        setStatus('error');
        setMessage(strings.invalid);
        return;
      }
      if (!response.ok || payload?.ok === false) {
        setStatus('error');
        setMessage(strings.error);
        return;
      }

      setStatus('success');
      setMessage(strings.success);
    } catch {
      setStatus('error');
      setMessage(strings.error);
    }
  }

  return (
    <div className={cn(layout.card, 'mx-auto flex max-w-3xl flex-col gap-md px-gutter py-2xl sm:px-2xl')}>
      <h2 className={cn(text.heading, 'text-2xl')}>{strings.title}</h2>
      <p className={cn(text.body)}>{strings.description}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-md" noValidate>
        <label className="flex flex-col gap-xs">
          <span className="text-sm font-medium text-text">{strings.email.label}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
            className="rounded-2xl border border-border bg-bg px-md py-sm text-base text-text shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            placeholder={strings.email.placeholder}
          />
        </label>
        <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:gap-md">
          <button
            type="submit"
            className={cn(buttons.primary, 'sm:w-auto')}
            disabled={status === 'loading' || email.trim() === ''}
          >
            {status === 'loading' ? strings.submit + '…' : strings.submit}
          </button>
          {message ? (
            <p className={cn('text-sm', status === 'success' ? 'text-status-success' : 'text-status-danger')} aria-live="polite">
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export default ResendConfirmForm;
