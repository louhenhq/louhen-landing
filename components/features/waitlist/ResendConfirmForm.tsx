'use client';

import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { buttons, cn, layout, text } from '@app/(site)/_lib/ui';
import { track } from '@lib/clientAnalytics';

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
type ResendOutcome = 'ok' | 'rate_limited' | 'error';

export function ResendConfirmForm({ strings }: ResendConfirmFormProps) {
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || status === 'loading') return;

    setStatus('loading');
    setMessage('');
    let outcome: ResendOutcome = 'ok';

    try {
      const response = await fetch('/api/waitlist/resend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), hcaptchaToken: 'dev-bypass' }),
      });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 429) {
        outcome = 'rate_limited';
        setStatus('error');
        setMessage(strings.rateLimited);
        return;
      }
      if (response.status === 400) {
        outcome = 'error';
        setStatus('error');
        setMessage(strings.invalid);
        return;
      }
      if (!response.ok || payload?.ok === false) {
        outcome = 'error';
        setStatus('error');
        setMessage(strings.error);
        return;
      }

      setStatus('success');
      setMessage(strings.success);
    } catch {
      outcome = 'error';
      setStatus('error');
      setMessage(strings.error);
    } finally {
      void track({ name: 'waitlist_resend_requested', locale, outcome });
    }
  }

  return (
    <Card className="mx-auto flex max-w-3xl flex-col gap-md px-gutter py-2xl sm:px-2xl">
      <h2 className={text.heading}>{strings.title}</h2>
      <p className={cn(text.body)}>{strings.description}</p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-md"
        noValidate
        data-ll="wl-resend-form"
      >
        <label className="flex flex-col gap-xs">
          <span className="text-sm font-medium text-text">{strings.email.label}</span>
          <input
            data-ll="wl-resend-email"
            type="email"
            required
            value={email}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
            placeholder={strings.email.placeholder}
          />
        </label>
        <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:gap-md">
          <Button
            type="submit"
            className="sm:w-auto"
            disabled={status === 'loading' || email.trim() === ''}
            data-ll="wl-resend-submit"
          >
            {strings.submit}
          </Button>
          {message ? (
            <p
              className={cn('text-sm', status === 'success' ? 'text-status-success' : 'text-status-danger')}
              aria-live="polite"
              data-ll="wl-resend-status"
            >
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
