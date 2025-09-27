'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { track } from '@/lib/clientAnalytics';

type ExpiredResendFormProps = {
  ttlDays: number;
};

type MessageTone = 'success' | 'error';

type ResendOutcome = 'ok' | 'rate_limited' | 'error';

function isValidEmail(value: string): boolean {
  return /.+@.+\..+/.test(value.trim());
}

function parseRetryAfterSeconds(value: string | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export default function ExpiredResendForm({ ttlDays }: ExpiredResendFormProps) {
  const waitlistT = useTranslations('waitlist');
  const errorsT = useTranslations('errors');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<MessageTone | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void track({ name: 'waitlist_signup_expired', locale, ttlDays: Number.isFinite(ttlDays) ? ttlDays : null });
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    };
  }, [locale, ttlDays]);

  const emailTrimmed = email.trim();
  const disableSubmit = useMemo(() => {
    if (pending) return true;
    if (!emailTrimmed) return true;
    if (!isValidEmail(emailTrimmed)) return true;
    if (cooldownUntil && cooldownUntil > Date.now()) return true;
    return false;
  }, [pending, emailTrimmed, cooldownUntil]);

  function scheduleCooldown(seconds: number | null) {
    if (!seconds) return;
    const now = Date.now();
    const target = now + seconds * 1000;
    setCooldownUntil(target);
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = setTimeout(() => {
      setCooldownUntil(null);
      cooldownTimerRef.current = null;
    }, seconds * 1000);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disableSubmit) return;

    setPending(true);
    setMessage(null);
    setMessageTone(null);

    let outcome: ResendOutcome = 'ok';

    try {
      const response = await fetch('/api/waitlist/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailTrimmed,
          hcaptchaToken: 'dev-bypass',
        }),
      });

      if (response.ok) {
        setMessage(waitlistT('expired.resend.success'));
        setMessageTone('success');
        return;
      }

      if (response.status === 429) {
        outcome = 'rate_limited';
        setMessage(waitlistT('expired.resend.rateLimited'));
        setMessageTone('error');
        scheduleCooldown(parseRetryAfterSeconds(response.headers.get('Retry-After')));
        return;
      }

      if (response.status === 400) {
        outcome = 'error';
        setMessage(errorsT('email.invalid'));
        setMessageTone('error');
        return;
      }

      outcome = 'error';
      setMessage(errorsT('generic'));
      setMessageTone('error');
    } catch (error) {
      console.error('[waitlist:resend]', error instanceof Error ? error.message : error);
      outcome = 'error';
      setMessage(errorsT('generic'));
      setMessageTone('error');
    } finally {
      setPending(false);
      void track({ name: 'waitlist_resend_requested', locale, outcome });
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={pending} className="mt-6 flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-900" htmlFor="resend-email">
        {waitlistT('resend.email.label')}
        <input
          id="resend-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setMessage(null);
            setMessageTone(null);
          }}
          placeholder={waitlistT('resend.email.placeholder')}
          autoComplete="email"
          className="rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-900 transition-shadow duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        />
      </label>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        <span className="block font-semibold text-slate-700">hCaptcha</span>
        <span className="mt-1 block">Placeholder — resend wiring lands later.</span>
      </div>

      <button
        type="submit"
        disabled={disableSubmit}
        className="inline-flex w-fit items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? `${waitlistT('expired.resend.cta')}…` : waitlistT('expired.resend.cta')}
      </button>

      {message ? (
        <p role="status" className={`text-sm ${messageTone === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
