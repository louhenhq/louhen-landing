'use client';

<<<<<<< HEAD
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import ConsentNotice from '@/app/(site)/components/ConsentNotice';
import { Button, Card, Checkbox, Input } from '@/components/ui';
import { text } from '@/app/(site)/_lib/ui';
import { track } from '@/lib/clientAnalytics';
=======
import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import ConsentNotice from '@/app/(site)/components/ConsentNotice';
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))

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
<<<<<<< HEAD
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; consent?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasUtm, setHasUtm] = useState(false);
=======
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))

  const emailTrimmed = email.trim();
  const emailTouched = email.length > 0;
  const emailIsValid = useMemo(() => (emailTrimmed ? isValidEmail(emailTrimmed) : false), [emailTrimmed]);
<<<<<<< HEAD
  const inlineEmailError = emailTouched && !emailIsValid ? errorsT('email.invalid') : undefined;
  const emailError = fieldErrors.email ?? inlineEmailError;
  const consentError = fieldErrors.consent;
  const hasRef = useMemo(() => Boolean(source && source.trim()), [source]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const utmPresent = Array.from(params.keys()).some((key) => key.toLowerCase().startsWith('utm_'));
      setHasUtm(utmPresent);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[waitlist:utm-detect]', error instanceof Error ? error.message : error);
      }
      setHasUtm(false);
    }
  }, []);
=======
  const showInlineEmailError = emailTouched && !emailIsValid;
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

<<<<<<< HEAD
    setFieldErrors({});
    setFormError(null);

    if (!emailTrimmed) {
      const message = errorsT('required');
      setFieldErrors({ email: message });
      setFormError(message);
=======
    if (!emailTrimmed) {
      setError(errorsT('required'));
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
      setSuccessMessage(null);
      return;
    }

    if (!isValidEmail(emailTrimmed)) {
<<<<<<< HEAD
      const message = errorsT('email.invalid');
      setFieldErrors({ email: message });
      setFormError(message);
=======
      setError(errorsT('email.invalid'));
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
      setSuccessMessage(null);
      return;
    }

    if (!consent) {
<<<<<<< HEAD
      const message = errorsT('required');
      setFieldErrors({ consent: message });
      setFormError(message);
=======
      setError(errorsT('required'));
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
      setSuccessMessage(null);
      return;
    }

<<<<<<< HEAD
    setIsSubmitting(true);

    void track({ name: 'waitlist_signup_submitted', locale, hasUtm, hasRef });

=======
    setError(null);
    setIsSubmitting(true);

>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
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

<<<<<<< HEAD
      const responseBody = await response.json().catch(() => ({}));

      void track({
        name: 'waitlist_signup_result',
        ok: response.ok,
        code: typeof responseBody?.code === 'string' ? responseBody.code : null,
        source: source ?? null,
        locale,
        status: response.status,
      });

      if (!response.ok) {
        if (response.status === 429) {
          setFieldErrors({});
          setFormError(errorsT('rateLimited'));
          setSuccessMessage(null);
          return;
        }

        setFieldErrors({});
        setFormError(errorsT('generic'));
        setSuccessMessage(null);
        return;
=======
      if (!response.ok) {
        throw new Error('waitlist_request_failed');
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
      }

      const payload = { email: emailTrimmed, consent: true, locale, source: source ?? undefined };
      onSubmit?.(payload);

<<<<<<< HEAD
      setFieldErrors({});
      setFormError(null);
=======
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
      setSuccessMessage(t('success.subtitle'));
      setEmail('');
      setConsent(false);
    } catch (requestError) {
      console.error('[waitlist:submit]', {
        message: requestError instanceof Error ? requestError.message : 'unknown_error',
      });
<<<<<<< HEAD
      setFieldErrors({});
      setFormError(errorsT('generic'));
=======
      setError(errorsT('generic'));
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  const disableSubmit = isSubmitting || !emailTrimmed || !emailIsValid || !consent;

  return (
<<<<<<< HEAD
    <Card
      as="form"
      id="waitlist-form"
      onSubmit={handleSubmit}
      aria-describedby={formError ? 'waitlist-error' : undefined}
      aria-busy={isSubmitting}
      className="w-full px-lg py-xl"
      noValidate
    >
      <div className="flex flex-col gap-md">
        <div>
          <label htmlFor="waitlist-email" className={text.label}>
            {t('email.label')}
          </label>
          <Input
=======
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
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
            id="waitlist-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
<<<<<<< HEAD
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
              setFormError(null);
=======
              setError(null);
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
              setSuccessMessage(null);
            }}
            autoComplete="email"
            placeholder={t('email.placeholder')}
<<<<<<< HEAD
            aria-describedby={emailError ? 'waitlist-email-error' : undefined}
            invalid={Boolean(emailError)}
            className="mt-xs"
          />
          {emailError ? (
            <p id="waitlist-email-error" className="mt-xs text-body-sm text-feedback-error" role="alert">
              {emailError}
=======
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
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
            </p>
          ) : null}
        </div>

<<<<<<< HEAD
        <div className="flex flex-col gap-xs">
          <div className="flex items-start gap-sm">
            <Checkbox
              id="waitlist-consent"
              name="consent"
              checked={consent}
              onChange={(event) => {
                setConsent(event.target.checked);
                setFieldErrors((prev) => ({ ...prev, consent: undefined }));
                setFormError(null);
                setSuccessMessage(null);
              }}
              required
              invalid={Boolean(consentError)}
              aria-describedby={consentError ? 'waitlist-consent-error' : undefined}
            />
            <ConsentNotice />
          </div>
          {consentError ? (
            <p id="waitlist-consent-error" className="text-body-sm text-feedback-error" role="alert">
              {consentError}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-dashed border-feedback-info-border bg-feedback-info-surface px-md py-lg text-body-sm text-text-muted">
          <span className="block text-label text-text">hCaptcha</span>
          <span className="mt-xs block">Placeholder — integration arrives with backend slice.</span>
        </div>

        {showUrgencyBadge ? (
          <p className="text-body-sm font-medium text-feedback-success" role="status">
=======
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
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
            {t('urgency.badge')}
          </p>
        ) : null}

<<<<<<< HEAD
        <Button type="submit" disabled={disableSubmit} loading={isSubmitting}>
          {t('submit.cta')}
        </Button>

        {formError ? (
          <p id="waitlist-error" role="alert" className="text-body-sm text-feedback-error">
            {formError}
=======
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
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
          </p>
        ) : null}

        {successMessage ? (
<<<<<<< HEAD
          <p role="status" data-testid="waitlist-success-message" className="text-body-sm text-feedback-success">
=======
          <p role="status" className="text-sm text-emerald-600">
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
            {successMessage}
          </p>
        ) : null}
      </div>
<<<<<<< HEAD
    </Card>
=======
    </form>
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  );
}
