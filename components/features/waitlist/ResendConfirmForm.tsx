'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/app/(site)/_lib/ui';
import { Button, Card, Input } from '@/components/ui';
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
  const [message, setMessage] = useState<string | null>(null);

  const trimmedEmail = email.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedEmail || status === 'loading') return;

    setStatus('loading');
    setMessage(null);
    let outcome: ResendOutcome = 'ok';

    try {
      const response = await fetch('/api/waitlist/resend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, hcaptchaToken: 'dev-bypass' }),
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
      if (!response.ok || (payload as { ok?: boolean })?.ok === false) {
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
    <Card
      data-testid="waitlist-resend-card"
      className="mx-auto flex w-full max-w-3xl flex-col gap-md px-gutter py-2xl sm:px-2xl"
    >
      <h2 className="text-display-lg text-text">{strings.title}</h2>
      <p className="text-body text-text-muted">{strings.description}</p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-md"
        noValidate
        data-testid="waitlist-resend-form"
        data-ll="wl-resend-form"
      >
        <label className="flex flex-col gap-xs" htmlFor="waitlist-resend-email">
          <span className="text-body-sm font-medium text-text">{strings.email.label}</span>
          <Input
            id="waitlist-resend-email"
            data-testid="waitlist-resend-email"
            data-ll="wl-resend-email"
            type="email"
            required
            value={email}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
            placeholder={strings.email.placeholder}
            invalid={status === 'error'}
            aria-describedby={message ? 'waitlist-resend-status' : undefined}
          />
        </label>
        <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:gap-md">
          <Button
            type="submit"
            variant="primary"
            loading={status === 'loading'}
            loadingLabel={strings.submit}
            disabled={status === 'loading' || trimmedEmail === ''}
            data-testid="waitlist-resend-submit"
            data-ll="wl-resend-submit"
          >
            {strings.submit}
          </Button>
          {message ? (
            <p
              id="waitlist-resend-status"
              className={cn('text-body-sm', status === 'success' ? 'text-status-success' : 'text-status-danger')}
              aria-live="polite"
              role="status"
              data-testid="waitlist-resend-status"
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
