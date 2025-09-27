'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import ConsentNotice from '@/app/(site)/components/ConsentNotice';

type WaitlistFormProps = {
  defaultEmail?: string;
  source?: string | null;
  onSubmit?: (payload: { email: string; consent: boolean; locale: string; source?: string | null }) => void;
  showUrgencyBadge?: boolean;
};

function isValidEmail(value: string): boolean {
  return /.+@.+\..+/.test(value.trim());
}

export default function WaitlistForm({
  defaultEmail = '',
  source,
  onSubmit,
  showUrgencyBadge = false,
}: WaitlistFormProps) {
  const t = useTranslations('waitlist');
  const errorsT = useTranslations('errors');
  const locale = useLocale();
  const [email, setEmail] = useState(defaultEmail);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailTrimmed = email.trim();
  const emailTouched = email.length > 0;
  const emailIsValid = useMemo(() => (emailTrimmed ? isValidEmail(emailTrimmed) : false), [emailTrimmed]);
  const showInlineEmailError = emailTouched && !emailIsValid;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!emailTrimmed) {
      setError(errorsT('required'));
      setSuccessMessage(null);
      return;
    }

    if (!isValidEmail(emailTrimmed)) {
      setError(errorsT('email.invalid'));
      setSuccessMessage(null);
      return;
    }

    if (!consent) {
      setError(errorsT('required'));
      setSuccessMessage(null);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailTrimmed,
          consent: true,
          locale,
          ref: source ?? undefined,
          hcaptchaToken: 'dev-bypass',
        }),
      });

      if (!response.ok) {
        throw new Error('waitlist_request_failed');
      }

      const payload = { email: emailTrimmed, consent: true, locale, source: source ?? undefined };
      onSubmit?.(payload);

      setSuccessMessage(t('success.subtitle'));
      setEmail('');
      setConsent(false);
    } catch (requestError) {
      console.error('[waitlist:submit]', {
        message: requestError instanceof Error ? requestError.message : 'unknown_error',
      });
      setError(errorsT('generic'));
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  const disableSubmit = isSubmitting || !emailTrimmed || !emailIsValid || !consent;

  return (
    <form
      onSubmit={handleSubmit}
      aria-describedby={error ? 'waitlist-error' : undefined}
      aria-busy={isSubmitting}
      className="mx-auto mt-10 w-full max-w-xl rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-lg"
      noValidate
    >
      <div className="flex flex-col gap-6">
        <div>
          <label htmlFor="waitlist-email" className="text-sm font-medium text-slate-900">
            {t('email.label')}
          </label>
          <input
            id="waitlist-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
              setSuccessMessage(null);
            }}
            autoComplete="email"
            placeholder={t('email.placeholder')}
            aria-describedby={[
              showInlineEmailError ? 'waitlist-email-inline-error' : null,
              error ? 'waitlist-error' : null,
            ]
              .filter(Boolean)
              .join(' ') || undefined}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-900 transition-shadow duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          />
          {showInlineEmailError ? (
            <p id="waitlist-email-inline-error" className="mt-2 text-sm text-rose-600" role="alert">
              {errorsT('email.invalid')}
            </p>
          ) : null}
        </div>

        <div className="flex items-start gap-3">
          <input
            id="waitlist-consent"
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked);
              setError(null);
            }}
            aria-describedby="waitlist-consent-help"
            className="mt-1 h-5 w-5 rounded border border-slate-300 accent-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          />
          <ConsentNotice />
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          <span className="block font-semibold text-slate-700">hCaptcha</span>
          <span className="mt-1 block">Placeholder — integration arrives with backend slice.</span>
        </div>

        {showUrgencyBadge ? (
          <p className="text-sm font-medium text-emerald-600" role="status">
            {t('urgency.badge')}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={disableSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? `${t('submit.cta')}…` : t('submit.cta')}
        </button>

        {error ? (
          <p id="waitlist-error" role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        ) : null}

        {successMessage ? (
          <p role="status" className="text-sm text-emerald-600">
            {successMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}
