'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { buttons, cn } from '@/app/(site)/_lib/ui';
import { track } from '@/lib/clientAnalytics';

export default function ConfirmResendForm() {
  const t = useTranslations('confirm.resend');
  const waitlistT = useTranslations('waitlist.form.labels');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/waitlist/resend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, hcaptchaToken: 'dev-bypass' }),
      });
      if (res.ok) {
        setStatus('success');
        track({ name: 'wl_resend', status: 'ok' });
      } else {
        setStatus('error');
        track({ name: 'wl_resend', status: 'error' });
      }
    } catch (error) {
      console.error('resend confirm failed', error);
      setStatus('error');
      track({ name: 'wl_resend', status: 'error' });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-lg flex flex-col gap-sm md:flex-row md:items-center" onSubmit={handleSubmit} aria-busy={pending}>
      <label className="flex w-full flex-col gap-xs md:max-w-sm">
        <span className="text-sm font-medium text-text">{waitlistT('email')}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className="rounded-lg border border-border bg-bg px-md py-sm text-base text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        />
      </label>
      <div className="flex items-center gap-sm md:mt-[30px]">
        <button type="submit" disabled={pending || email === ''} className={cn(buttons.secondary, 'whitespace-nowrap')}>
          {t('cta')}
        </button>
        {status === 'success' && (
          <span className="text-sm text-status-success" aria-live="polite">{t('sent')}</span>
        )}
        {status === 'error' && (
          <span className="text-sm text-status-danger" aria-live="polite">{t('error')}</span>
        )}
      </div>
    </form>
  );
}
