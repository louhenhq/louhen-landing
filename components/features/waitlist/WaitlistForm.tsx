'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type FormEvent,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from 'react';
import { cn } from '@/app/(site)/_lib/ui';
import { usePrefersReducedMotion } from '@/app/(site)/_lib/usePrefersReducedMotion';
import { Button, Card, Checkbox, Input } from '@/components/ui';
import { track } from '@lib/clientAnalytics';

type HCaptchaProps = {
  onVerify?: (token: string, ekey: string) => void;
  onExpire?: () => void;
  sitekey: string;
  [key: string]: unknown;
};

type HCaptchaComponent = ComponentType<HCaptchaProps>;
type HCaptchaRef = {
  resetCaptcha: () => void;
};

type HCaptchaForwardRef = ForwardRefExoticComponent<HCaptchaProps & RefAttributes<HCaptchaRef>>;

async function loadHCaptcha(): Promise<HCaptchaComponent> {
  const rawModule = (await import('@hcaptcha/react-hcaptcha')) as unknown;
  const mod = rawModule as { default?: HCaptchaComponent };
  return mod.default ?? (rawModule as HCaptchaComponent);
}

const HCaptcha = dynamic(async () => loadHCaptcha(), { ssr: false }) as unknown as HCaptchaForwardRef;

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

type FieldErrors = {
  email?: string;
  consent?: string;
  captcha?: string;
};

export type WaitlistFormProps = {
  headingId?: string;
  className?: string;
  defaultEmail?: string;
  source?: string | null;
  onSuccess?: (payload: { email: string }) => void;
};

const captchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY?.trim() ?? '';
const captchaEnabled = captchaSiteKey.length > 0;

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

export function WaitlistForm({
  headingId = 'waitlist-heading',
  className,
  defaultEmail = '',
  source,
  onSuccess,
}: WaitlistFormProps) {
  const t = useTranslations('waitlist.form');
  const locale = useLocale();
  const prefersReducedMotion = usePrefersReducedMotion();

  const [email, setEmail] = useState(defaultEmail);
  const [consent, setConsent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaTheme, setCaptchaTheme] = useState<'light' | 'dark'>('light');
  const [status, setStatus] = useState<SubmitState>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [summaryErrors, setSummaryErrors] = useState<string[]>([]);
  const [serverHint, setServerHint] = useState<string | null>(null);
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState<string | null>(null);

  const captchaRef = useRef<HCaptchaRef | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const consentRef = useRef<HTMLInputElement | null>(null);
  const captchaContainerRef = useRef<HTMLDivElement | null>(null);
  const successHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const normalizedSource = useMemo(() => source?.trim() || null, [source]);
  const captchaRequired = captchaEnabled;
  const disabled = status === 'loading';

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const updateTheme = () => {
      const explicit = root.dataset.theme;
      if (explicit === 'dark' || explicit === 'light') {
        setCaptchaTheme(explicit);
        return;
      }
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      setCaptchaTheme(prefersDark ? 'dark' : 'light');
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const handleMediaChange = () => updateTheme();
    media?.addEventListener?.('change', handleMediaChange);
    return () => {
      observer.disconnect();
      media?.removeEventListener?.('change', handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (status !== 'error' && summaryErrors.length === 0) return;

    const frame = requestAnimationFrame(() => {
      if (fieldErrors.email) {
        emailInputRef.current?.focus({ preventScroll: false });
        return;
      }

      if (fieldErrors.consent) {
        consentRef.current?.focus({ preventScroll: false });
        return;
      }

      if (fieldErrors.captcha) {
        const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
        captchaContainerRef.current?.scrollIntoView({ behavior, block: 'center' });
        captchaContainerRef.current?.focus({ preventScroll: false });
        return;
      }

      if (summaryErrors.length > 0) {
        errorSummaryRef.current?.focus({ preventScroll: false });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [fieldErrors, prefersReducedMotion, status, summaryErrors]);

  useEffect(() => {
    if (status !== 'success') return;
    const frame = requestAnimationFrame(() => {
      successHeadingRef.current?.focus({ preventScroll: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [status]);

  const clearErrors = useCallback(() => {
    setFieldErrors({});
    setSummaryErrors([]);
    setServerHint(null);
  }, []);

  const resetCaptcha = useCallback(() => {
    if (!captchaEnabled) return;
    captchaRef.current?.resetCaptcha();
    setCaptchaToken(null);
  }, []);

  const validate = useCallback(() => {
    const trimmedEmail = email.trim();
    const errors: FieldErrors = {};
    const messages: string[] = [];

    if (!trimmedEmail) {
      const message = t('errors.emailRequired');
      errors.email = message;
      messages.push(message);
    } else if (!isValidEmail(trimmedEmail)) {
      const message = t('errors.emailInvalid');
      errors.email = message;
      messages.push(message);
    }

    if (!consent) {
      const message = t('errors.consent');
      errors.consent = message;
      messages.push(message);
    }

    if (captchaRequired && !captchaToken) {
      const message = t('errors.captchaRequired');
      errors.captcha = message;
      messages.push(message);
    }

    setFieldErrors(errors);
    setSummaryErrors(messages);
    return messages.length === 0;
  }, [captchaRequired, captchaToken, consent, email, t]);

  const onCaptchaVerify: NonNullable<HCaptchaProps['onVerify']> = useCallback((token) => {
    setCaptchaToken(token);
    setFieldErrors((prev) => ({ ...prev, captcha: undefined }));
  }, []);

  const onCaptchaExpire: NonNullable<HCaptchaProps['onExpire']> = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (disabled) return;

      clearErrors();

      if (!validate()) {
        setStatus('error');
        return;
      }

      const trimmedEmail = email.trim();
      setStatus('loading');
      setServerHint(null);

      void track({
        name: 'waitlist_signup_submitted',
        locale,
        hasUtm: Boolean(normalizedSource),
        hasRef: Boolean(normalizedSource),
      });

      try {
        const response = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            email: trimmedEmail,
            consent: true,
            locale,
            ref: normalizedSource ?? undefined,
            hcaptchaToken: captchaToken ?? (captchaEnabled ? '' : 'dev-bypass'),
          }),
        });

        const payload = await response.json().catch(() => ({}));
        const code = typeof payload?.code === 'string' ? payload.code : null;
        const details = Array.isArray(payload?.details) ? (payload.details as string[]) : [];

        track({
          name: 'waitlist_signup_result',
          ok: response.ok,
          code,
          source: normalizedSource,
          locale,
          status: response.status,
        });

        if (response.ok) {
          setStatus('success');
          setLastSubmittedEmail(trimmedEmail);
          setFieldErrors({});
          setSummaryErrors([]);
          setServerHint(null);
          setConsent(true);
          setEmail('');
          onSuccess?.({ email: trimmedEmail });
          resetCaptcha();
          return;
        }

        const nextFieldErrors: FieldErrors = {};
        if (details.includes('email')) {
          nextFieldErrors.email = t('errors.emailInvalid');
        }
        if (details.includes('consent')) {
          nextFieldErrors.consent = t('errors.consent');
        }
        if (details.includes('hcaptchaToken')) {
          nextFieldErrors.captcha = t('errors.captchaRequired');
        }

        let topLevel: string | null = null;
        if (response.status === 429 || code === 'rate_limited') {
          topLevel = t('errors.rateLimited');
        } else if (code === 'captcha_invalid') {
          topLevel = t('errors.captchaFailed');
          nextFieldErrors.captcha = t('errors.captchaFailed');
        } else if (response.status === 400) {
          topLevel = t('errors.invalid');
        } else if (response.status === 410 || code === 'token_expired') {
          topLevel = t('errors.expired');
        } else {
          topLevel = t('errors.default');
        }

        const nextSummary = [...Object.values(nextFieldErrors).filter(Boolean)];
        if (topLevel && !nextSummary.includes(topLevel)) {
          nextSummary.push(topLevel);
        }

        setFieldErrors(nextFieldErrors);
        setSummaryErrors(nextSummary);
        setServerHint(topLevel);
        setStatus('error');
        resetCaptcha();
      } catch (error) {
        console.error('waitlist submit failed', error);
        const fallback = t('errors.network');
        setFieldErrors({});
        setSummaryErrors([fallback]);
        setServerHint(fallback);
        setStatus('error');
        resetCaptcha();
      }
    },
    [captchaToken, clearErrors, disabled, email, locale, normalizedSource, onSuccess, resetCaptcha, t, validate]
  );

  const handlePrepareResend = useCallback(() => {
    setStatus('idle');
    setSummaryErrors([]);
    setFieldErrors({});
    setServerHint(null);
    setConsent(true);
    if (lastSubmittedEmail) {
      setEmail(lastSubmittedEmail);
    }
    resetCaptcha();
    requestAnimationFrame(() => {
      emailInputRef.current?.focus({ preventScroll: false });
    });
  }, [lastSubmittedEmail, resetCaptcha]);

  const cardClasses = cn('flex w-full flex-col gap-lg px-gutter py-2xl sm:px-2xl', className);

  return (
    <Card data-ll="wl-card" data-testid="waitlist-form-card" className={cardClasses}>
      <header className="flex flex-col gap-xs">
        <h2 id={headingId} className="text-display-lg text-text">
          {t('title')}
        </h2>
        <p className="text-body text-text-muted">{t('lead')}</p>
      </header>

      {status === 'success' ? (
        <div className="flex flex-col gap-md" role="status" aria-live="assertive" data-ll="wl-success">
          <div className="flex flex-col gap-sm rounded-2xl border border-status-success bg-status-success/10 px-md py-sm text-status-success">
            <h3 ref={successHeadingRef} tabIndex={-1} className="text-h3 text-status-success">
              {t('success.title')}
            </h3>
            <p className="text-body text-text">{t('success.body')}</p>
            <p className="text-body-sm text-text-muted">{t('success.followUp')}</p>
          </div>
          <div className="flex flex-col gap-xs">
            <Button variant="secondary" size="sm" onClick={handlePrepareResend} className="w-fit">
              {t('success.resend.cta')}
            </Button>
            <p className="text-body-sm text-text-muted">{t('success.resend.hint')}</p>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-busy={status === 'loading'}
          aria-describedby={summaryErrors.length ? 'waitlist-error-summary' : undefined}
          data-ll="wl-form"
          className="flex flex-col gap-lg"
        >
          {summaryErrors.length > 0 ? (
            <div
              id="waitlist-error-summary"
              ref={errorSummaryRef}
              tabIndex={-1}
              role="alert"
              aria-live="assertive"
              className="rounded-2xl border border-feedback-error bg-feedback-error-surface px-md py-sm shadow-card"
            >
              <p className="text-label text-feedback-error">{t('errors.summaryTitle')}</p>
              <ul className="mt-xs list-disc space-y-1 pl-md text-body-sm text-feedback-error">
                {summaryErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col gap-xs">
            <label htmlFor="waitlist-email" className="text-body text-text">
              {t('labels.email')}
            </label>
            <Input
              ref={emailInputRef}
              id="waitlist-email"
              data-ll="wl-email-input"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              onBlur={() => setEmail((value) => value.trim())}
              placeholder={t('placeholders.email')}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'waitlist-email-error' : undefined}
              invalid={Boolean(fieldErrors.email)}
              required
            />
            {fieldErrors.email ? (
              <p id="waitlist-email-error" className="text-body-sm text-feedback-error" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-xs">
            <div className="flex items-start gap-sm rounded-2xl border border-border bg-bg px-md py-sm">
              <Checkbox
                ref={consentRef}
                id="waitlist-consent"
                data-ll="wl-consent-checkbox"
                name="consent"
                checked={consent}
                onChange={(event) => {
                  setConsent(event.target.checked);
                  if (fieldErrors.consent) {
                    setFieldErrors((prev) => ({ ...prev, consent: undefined }));
                  }
                }}
                aria-invalid={Boolean(fieldErrors.consent)}
                aria-describedby={fieldErrors.consent ? 'waitlist-consent-error' : undefined}
                invalid={Boolean(fieldErrors.consent)}
              />
              <label htmlFor="waitlist-consent" className="text-body text-text-muted leading-relaxed">
                {t('labels.consent')}{' '}
                <Link prefetch={false} href={`/${locale}/privacy`} className="underline">
                  {t('privacyLinkLabel')}
                </Link>
                .
              </label>
            </div>
            {fieldErrors.consent ? (
              <p id="waitlist-consent-error" className="text-body-sm text-feedback-error" role="alert">
                {fieldErrors.consent}
              </p>
            ) : null}
          </div>

          {captchaEnabled ? (
            <div className="flex flex-col gap-xs" role="group" aria-labelledby="waitlist-captcha-label">
              <span id="waitlist-captcha-label" className="text-label text-text">
                {t('labels.captcha')}
              </span>
              <div
                ref={captchaContainerRef}
                className="rounded-2xl border border-border bg-bg px-md py-md"
                tabIndex={-1}
                aria-describedby={fieldErrors.captcha ? 'waitlist-captcha-error' : undefined}
                data-ll="wl-captcha"
                style={{ minHeight: '180px' }}
              >
                <HCaptcha
                  ref={captchaRef}
                  sitekey={captchaSiteKey}
                  size="normal"
                  theme={captchaTheme}
                  onVerify={onCaptchaVerify}
                  onExpire={onCaptchaExpire}
                />
              </div>
              {fieldErrors.captcha ? (
                <p className="text-body-sm text-feedback-error" id="waitlist-captcha-error" role="alert">
                  {fieldErrors.captcha}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              data-ll="wl-submit"
              loading={status === 'loading'}
              loadingLabel={t('inflight')}
              disabled={disabled}
            >
              {t('submit')}
            </Button>
            {serverHint ? (
              <p className="text-body-sm text-feedback-error" role="alert" data-ll="wl-error">
                {serverHint}
              </p>
            ) : null}
          </div>
        </form>
      )}
    </Card>
  );
}
