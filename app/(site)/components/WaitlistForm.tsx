'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import ConsentNotice from '@/app/(site)/components/ConsentNotice';
import { buttons, focusRing, inputs, layout } from '@/app/(site)/_lib/ui';
import { track } from '@/lib/clientAnalytics';
import { cn } from '@/app/(site)/_lib/ui';

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
  const [hasUtm, setHasUtm] = useState(false);

  const emailTrimmed = email.trim();
  const emailTouched = email.length > 0;
  const emailIsValid = useMemo(() => (emailTrimmed ? isValidEmail(emailTrimmed) : false), [emailTrimmed]);
  const showInlineEmailError = emailTouched && !emailIsValid;
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

    void track({ name: 'waitlist_signup_submitted', locale, hasUtm, hasRef });

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
          setError(errorsT('rateLimited'));
          setSuccessMessage(null);
          return;
        }

        setError(errorsT('generic'));
        setSuccessMessage(null);
        return;
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
      id="waitlist-form"
      onSubmit={handleSubmit}
      aria-describedby={error ? 'waitlist-error' : undefined}
      aria-busy={isSubmitting}
      className={cn(layout.card, 'w-full px-lg py-xl')}
      noValidate
    >
      <div className="flex flex-col gap-md">
        <div>
          <label htmlFor="waitlist-email" className={text.label}>
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
            className={cn('mt-xs w-full', inputs)}
          />
          {showInlineEmailError ? (
            <p id="waitlist-email-inline-error" className="mt-xs text-body-sm text-feedback-error" role="alert">
              {errorsT('email.invalid')}
            </p>
          ) : null}
        </div>

        <div className="flex items-start gap-sm">
          <input
            id="waitlist-consent"
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => {
              setConsent(event.target.checked);
              setError(null);
            }}
            required
            className={cn('mt-[calc(var(--spacing-8)/2)] h-5 w-5 rounded-md border border-border accent-brand bg-bg', focusRing)}
          />
          <ConsentNotice />
        </div>

        <div className="rounded-2xl border border-dashed border-feedback-info-border bg-feedback-info-surface px-md py-lg text-body-sm text-text-muted">
          <span className="block text-label text-text">hCaptcha</span>
          <span className="mt-xs block">Placeholder — integration arrives with backend slice.</span>
        </div>

        {showUrgencyBadge ? (
          <p className="text-body-sm font-medium text-feedback-success" role="status">
            {t('urgency.badge')}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={disableSubmit}
          className={cn(buttons.primary, 'px-lg py-sm')}
        >
          {isSubmitting ? `${t('submit.cta')}…` : t('submit.cta')}
        </button>

        {error ? (
          <p id="waitlist-error" role="alert" className="text-body-sm text-feedback-error">
            {error}
          </p>
        ) : null}

        {successMessage ? (
          <p role="status" data-testid="waitlist-success-message" className="text-body-sm text-feedback-success">
            {successMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}
