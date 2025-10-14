'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import ConsentNotice from '@/app/(site)/components/ConsentNotice';
import { Button, Card, Checkbox, Input } from '@/components/ui';
import { text } from '@/app/(site)/_lib/ui';
import { track } from '@/lib/clientAnalytics';

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
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; consent?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasUtm, setHasUtm] = useState(false);

  const emailTrimmed = email.trim();
  const emailTouched = email.length > 0;
  const emailIsValid = useMemo(() => (emailTrimmed ? isValidEmail(emailTrimmed) : false), [emailTrimmed]);
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFieldErrors({});
    setFormError(null);

    if (!emailTrimmed) {
      const message = errorsT('required');
      setFieldErrors({ email: message });
      setFormError(message);
      setSuccessMessage(null);
      return;
    }

    if (!isValidEmail(emailTrimmed)) {
      const message = errorsT('email.invalid');
      setFieldErrors({ email: message });
      setFormError(message);
      setSuccessMessage(null);
      return;
    }

    if (!consent) {
      const message = errorsT('required');
      setFieldErrors({ consent: message });
      setFormError(message);
      setSuccessMessage(null);
      return;
    }

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
          setFieldErrors({});
          setFormError(errorsT('rateLimited'));
          setSuccessMessage(null);
          return;
        }

        setFieldErrors({});
        setFormError(errorsT('generic'));
        setSuccessMessage(null);
        return;
      }

      const payload = { email: emailTrimmed, consent: true, locale, source: source ?? undefined };
      onSubmit?.(payload);

      setFieldErrors({});
      setFormError(null);
      setSuccessMessage(t('success.subtitle'));
      setEmail('');
      setConsent(false);
    } catch (requestError) {
      console.error('[waitlist:submit]', {
        message: requestError instanceof Error ? requestError.message : 'unknown_error',
      });
      setFieldErrors({});
      setFormError(errorsT('generic'));
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = emailIsValid && consent && !isSubmitting;
  const submitState = canSubmit ? 'enabled' : 'disabled';

  return (
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
            id="waitlist-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
              setFormError(null);
              setSuccessMessage(null);
            }}
            autoComplete="email"
            placeholder={t('email.placeholder')}
            aria-describedby={emailError ? 'waitlist-email-error' : undefined}
            invalid={Boolean(emailError)}
            className="mt-xs"
          />
          {emailError ? (
            <p id="waitlist-email-error" className="mt-xs text-body-sm text-feedback-error" role="alert">
              {emailError}
            </p>
          ) : null}
        </div>

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
            {t('urgency.badge')}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          data-state={submitState}
          data-ll="wl-submit"
          loading={isSubmitting}
        >
          {t('submit.cta')}
        </Button>

        {formError ? (
          <p id="waitlist-error" role="alert" className="text-body-sm text-feedback-error">
            {formError}
          </p>
        ) : null}

        {successMessage ? (
          <p role="status" data-testid="waitlist-success-message" className="text-body-sm text-feedback-success">
            {successMessage}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
