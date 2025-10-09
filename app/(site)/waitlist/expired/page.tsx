<<<<<<< HEAD
import { createTranslator } from 'next-intl';
import ExpiredResendForm from '@/app/(site)/waitlist/_components/ExpiredResendForm';
import { loadWaitlistMessages } from '@/app/(site)/waitlist/_lib/messages';
import { getWaitlistConfirmTtlDays } from '@/lib/waitlistConfirmTtl';

export const dynamic = 'force-dynamic';

export default async function WaitlistExpiredPage() {
  const { locale, messages } = await loadWaitlistMessages();
  const t = createTranslator({ locale, messages, namespace: 'waitlist' });
  const ttlDays = getWaitlistConfirmTtlDays();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-sm px-md py-xl text-text">
      <h1 className="text-display-lg text-text">{t('expired.title')}</h1>
      <p className="text-body text-text-muted">{t('expired.subtitle')}</p>
      <ExpiredResendForm ttlDays={ttlDays} />
=======
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

function ResendPlaceholderForm() {
  const t = useTranslations('waitlist');
  const errorsT = useTranslations('errors');
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function isValidEmail(value: string) {
    return /.+@.+\..+/.test(value.trim());
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError(errorsT('required'));
      setMessage(null);
      return;
    }
    if (!isValidEmail(trimmed)) {
      setError(errorsT('email.invalid'));
      setMessage(null);
      return;
    }
    setError(null);
    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    console.log('[waitlist:resend]', { email: trimmed });
    setPending(false);
    setMessage(t('success.subtitle'));
  }

  const disable = pending || !email.trim();

  return (
    <form onSubmit={handleSubmit} aria-busy={pending} className="mt-6 flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-900" htmlFor="resend-email">
        {t('resend.email.label')}
        <input
          id="resend-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
            setMessage(null);
          }}
          placeholder={t('resend.email.placeholder')}
          className="rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-900 transition-shadow duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        />
      </label>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        <span className="block font-semibold text-slate-700">hCaptcha</span>
        <span className="mt-1 block">Placeholder — resend wiring lands later.</span>
      </div>

      <button
        type="submit"
        disabled={disable}
        className="inline-flex w-fit items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? `${t('expired.resend.cta')}…` : t('expired.resend.cta')}
      </button>

      {error ? (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm text-emerald-600">
          {message}
        </p>
      ) : null}
    </form>
  );
}

export default function WaitlistExpiredPage() {
  const t = useTranslations('waitlist');

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-12 text-slate-800">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('expired.title')}</h1>
      <p className="text-base text-slate-600">{t('expired.subtitle')}</p>
      <ResendPlaceholderForm />
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
    </main>
  );
}
