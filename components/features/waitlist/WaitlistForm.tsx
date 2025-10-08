'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import type { ComponentType, ForwardRefExoticComponent, RefAttributes } from 'react';
import { buttons, cn, layout, text } from '@app/(site)/_lib/ui';
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

export type WaitlistFormProps = {
  defaultEmail?: string;
  source?: string | null;
};

const captchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY?.trim() ?? '';
const captchaEnabled = captchaSiteKey.length > 0;
const isDevLike = process.env.NODE_ENV !== 'production';

export function WaitlistForm({ defaultEmail = '', source }: WaitlistFormProps) {
  const t = useTranslations('waitlist.form');
  const locale = useLocale();
  const [email, setEmail] = useState(defaultEmail);
  const [consent, setConsent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitState>('idle');
  const [message, setMessage] = useState<string>('');
  const captchaRef = useRef<HCaptchaRef | null>(null);

  const normalizedSource = useMemo(() => source?.trim() || null, [source]);
  const captchaRequired = captchaEnabled;

  const resetFeedback = useCallback(() => {
    setStatus('idle');
    setMessage('');
  }, []);

  useEffect(() => {
    setEmail(defaultEmail);
    resetFeedback();
  }, [defaultEmail, resetFeedback]);

  const resetCaptcha = useCallback(() => {
    if (!captchaEnabled) return;
    captchaRef.current?.resetCaptcha();
    setCaptchaToken(null);
  }, []);

  const onCaptchaVerify: NonNullable<HCaptchaProps['onVerify']> = useCallback((token) => {
    setCaptchaToken(token);
  }, []);

  const onCaptchaExpire: NonNullable<HCaptchaProps['onExpire']> = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  const disabled = useMemo(() => {
    if (status === 'loading' || status === 'success') return true;
    if (!email.trim()) return true;
    if (!consent) return true;
    if (captchaRequired && !captchaToken) return true;
    return false;
  }, [status, email, consent, captchaRequired, captchaToken]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    setStatus('loading');
    setMessage('');

    track({
      name: 'waitlist_signup_submitted',
      source: normalizedSource,
      locale,
      hasConsent: true,
    });

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          locale,
          gdprConsent: true,
          captchaToken: captchaToken ?? (captchaEnabled ? '' : 'dev-mode-bypass'),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      const code = typeof payload?.code === 'string' ? payload.code : null;

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
        setMessage(t('success.body'));
        return;
      }

      setStatus('error');

      const bodyMessage = typeof payload?.message === 'string' ? payload.message : '';

      if (response.status === 429) {
        setMessage(code === 'captcha_failed' ? t('errors.captcha') : t('errors.rateLimited'));
        resetCaptcha();
        return;
      }

      if (response.status === 410 || code === 'token_expired') {
        setMessage(t('errors.expired'));
        resetCaptcha();
        return;
      }

      if (response.status === 400) {
        setMessage(bodyMessage || t('errors.invalid'));
        resetCaptcha();
        return;
      }

      setMessage(bodyMessage || t('errors.default'));
      resetCaptcha();
    } catch (error) {
      console.error('waitlist submit failed', error);
      setStatus('error');
      setMessage(t('errors.network'));
      resetCaptcha();
    }
  }

  const successTitle = t('success.title');
  const consentLabel = t('labels.consent');

  return (
    <section id="waitlist" aria-labelledby="waitlist-heading" className={cn(layout.section, 'bg-bg')}>
      <div className={cn(layout.narrow)}>
        <div className={cn(layout.card, 'px-gutter py-2xl sm:px-2xl sm:py-3xl flex flex-col gap-xl')}>
          {!captchaEnabled && isDevLike && (
            <div className="rounded-2xl border border-status-warning bg-status-warning/10 px-md py-sm text-sm text-status-warning" role="status">
              {t('warnings.captchaMissing')}
            </div>
          )}

          <header className="flex flex-col gap-xs">
            <h2 id="waitlist-heading" className={text.heading}>{t('title')}</h2>
            <p className={text.body}>{t('lead')}</p>
          </header>

          {status === 'success' ? (
            <div
              className="flex flex-col gap-md"
              role="status"
              aria-live="assertive"
              data-ll="wl-success"
            >
              <div className="inline-flex items-center gap-sm rounded-2xl border border-status-success bg-status-success/10 px-md py-sm text-status-success">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-status-success text-white" aria-hidden>
                  ✓
                </span>
                <div className="flex flex-col">
                  <strong className="text-base font-semibold text-status-success">{successTitle}</strong>
                  <span className="text-sm text-status-success/80">{message}</span>
                </div>
              </div>
              <p className="text-sm text-text-muted">{t('success.followUp')}</p>
            </div>
          ) : (
            <form
              data-ll="wl-form"
              id="waitlist-form"
              className="flex flex-col gap-lg"
              onSubmit={handleSubmit}
              aria-busy={status === 'loading'}
              aria-live="polite"
            >
              <label className="flex flex-col gap-xs">
                <span className="text-sm font-medium text-text">{t('labels.email')}</span>
                <input
                  data-ll="wl-email-input"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (status !== 'idle') resetFeedback();
                  }}
                  onBlur={() => setEmail((value) => value.trim())}
                  aria-invalid={status === 'error'}
                  className="rounded-2xl border border-border bg-bg px-md py-sm text-base text-text shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                  placeholder={t('placeholders.email')}
                />
              </label>

              <div className="flex items-start gap-sm rounded-2xl border border-border bg-bg px-md py-sm">
                <input
                  data-ll="wl-consent-checkbox"
                  id="waitlist-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => {
                    setConsent(event.target.checked);
                    if (status === 'error') resetFeedback();
                  }}
                  className="mt-1 h-4 w-4 rounded border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                  required
                />
                <label htmlFor="waitlist-consent" className="text-sm text-text-muted leading-relaxed">
                  {consentLabel}{' '}
                  <Link prefetch={false} href={`/${locale}/privacy`} className="underline">
                    {t('privacyLinkLabel')}
                  </Link>
                  .
                </label>
              </div>

              {captchaEnabled ? (
                <div className="flex flex-col gap-xs">
                  <span className="text-sm font-medium text-text">{t('labels.captcha')}</span>
                  <div className="rounded-2xl border border-border bg-bg px-md py-sm">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={captchaSiteKey}
                      size="normal"
                      theme="light"
                      onVerify={onCaptchaVerify}
                      onExpire={onCaptchaExpire}
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  className={cn(buttons.primary, 'w-full sm:w-auto')}
                  disabled={disabled}
                  data-ll="wl-submit"
                >
                  {status === 'loading' ? t('inflight') : t('submit')}
                </button>
                {status === 'error' && message ? (
                  <p className="text-sm text-status-danger" role="alert" data-ll="wl-error">
                    {message}
                  </p>
                ) : null}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
