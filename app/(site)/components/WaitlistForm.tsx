'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/analytics';
import type { AnalyticsEvent } from '@/lib/analytics';
import { getAppliedRef, isRecentApplication } from '@/app/(site)/_lib/referral';
import { buttons, cn, layout, text } from '@/app/(site)/_lib/ui';

const OWNER_DOMAIN_KEY_PREFIX = 'wl_owner_domain_';

const COUNTRY_OPTIONS = ['DE', 'AT', 'CH', 'FR', 'NL', 'BE', 'SE', 'NO', 'FI', 'DK', 'IE', 'GB', 'ES', 'IT', 'PT', 'PL', 'US', 'CA', 'AU', 'NZ'];

function getCountryLabel(code: string, locale: string) {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
    return displayNames.of(code) || code;
  } catch {
    return code;
  }
}

function deriveCountryFromNavigator() {
  if (typeof navigator === 'undefined') return '';
  const locale = navigator.language || navigator.languages?.[0] || '';
  const region = locale.split('-')[1];
  if (region && COUNTRY_OPTIONS.includes(region.toUpperCase())) {
    return region.toUpperCase();
  }
  return '';
}

export default function WaitlistForm() {
  const t = useTranslations('waitlist.form');
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [country, setCountry] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    const inferred = deriveCountryFromNavigator();
    if (inferred && !country) {
      setCountry(inferred);
    }
  }, [country]);

  const countryOptions = useMemo(() => {
    return COUNTRY_OPTIONS.map((code) => ({ code, label: getCountryLabel(code, locale) }));
  }, [locale]);

  function getEmailDomain(value: string): string {
    const atIndex = value.lastIndexOf('@');
    if (atIndex === -1) return '';
    return value.slice(atIndex + 1).toLowerCase();
  }

  function getOwnerDomain(ref: string): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      return window.localStorage.getItem(`${OWNER_DOMAIN_KEY_PREFIX}${ref}`);
    } catch {
      return null;
    }
  }

  function setOwnerDomain(ref: string, domain: string) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(`${OWNER_DOMAIN_KEY_PREFIX}${ref}`, domain.toLowerCase());
    } catch {}
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setMessageTone(null);

    const target = event.currentTarget;
    if (!consent) {
      setMessage(t('errors.missingConsent'));
      setMessageTone('error');
      const consentInput = target.querySelector<HTMLInputElement>('input[name="consent"]');
      consentInput?.focus();
      return;
    }

    if (!target.reportValidity()) {
      const invalid = target.querySelector<HTMLElement>(':invalid');
      invalid?.focus();
      return;
    }

    const emailLc = email.trim().toLowerCase();
    const emailDomain = getEmailDomain(emailLc);
    const appliedRef = (getAppliedRef() || '').toUpperCase();
    const ownerDomain = appliedRef ? (getOwnerDomain(appliedRef) || '').toLowerCase() : '';
    const recentReferral = isRecentApplication();
    const selfReferralSuspect = Boolean(appliedRef && emailDomain && ownerDomain && ownerDomain === emailDomain && recentReferral);

    const submitEvent = (status: 'ok' | 'error', codeValue?: string) => {
      const payload: Record<string, unknown> = { name: 'wl_submit', status };
      if (codeValue) payload.code = codeValue;
      if (selfReferralSuspect) payload.selfReferralSuspect = true;
      track(payload as AnalyticsEvent);
    };

    setSubmitting(true);
    try {
      const effectiveRef = appliedRef || '';
      const body = {
        email: emailLc,
        href: typeof window !== 'undefined' ? window.location.href : undefined,
        referredBy: effectiveRef || undefined,
      };
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);

      if (res.status === 429) {
        setMessage(t('errors.rateLimited'));
        setMessageTone('error');
        submitEvent('error', 'rate_limited');
      } else if (res.status === 409) {
        setMessage(t('errors.already'));
        setMessageTone('error');
        submitEvent('error', 'already');
        router.push(`/${locale}/confirm-pending?status=already`);
      } else if (res.ok) {
        setMessage(t('success'));
        setMessageTone('success');
        submitEvent('ok');
      if (data?.code && emailDomain) {
        setOwnerDomain(String(data.code).toUpperCase(), emailDomain);
      }
        router.push(`/${locale}/confirm-pending`);
      } else {
        setMessage(t('errors.default'));
        setMessageTone('error');
        submitEvent('error', String(res.status));
      }
    } catch (error) {
      console.error('waitlist submit failed', error);
      setMessage(t('errors.default'));
      setMessageTone('error');
      submitEvent('error', 'network');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="waitlist" aria-labelledby="waitlist-heading" className={cn(layout.section, 'bg-bg')}>
      <div className={cn(layout.card, 'mx-auto max-w-3xl px-gutter py-2xl')}>
        <form
          className={layout.stackLg}
          onSubmit={handleSubmit}
          aria-busy={submitting}
          id="waitlist-form"
        >
          <div className="flex flex-col gap-xs">
            <h2 id="waitlist-heading" className={text.heading}>{t('title')}</h2>
            <p className={text.body}>{t('lead')}</p>
          </div>
          <div className="grid grid-cols-1 gap-md md:grid-cols-2">
            <label className="flex flex-col gap-xs">
              <span className="text-sm font-medium text-text">{t('labels.email')}</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder={t('placeholders.email')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-lg border border-border bg-bg px-md py-sm text-base text-text shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-sm font-medium text-text">{t('labels.firstName')}</span>
              <input
                type="text"
                name="firstName"
                autoComplete="given-name"
                placeholder={t('placeholders.firstName')}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="rounded-lg border border-border bg-bg px-md py-sm text-base text-text shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              />
            </label>
            <label className="flex flex-col gap-xs md:col-span-2">
              <span className="text-sm font-medium text-text">{t('labels.country')}</span>
              <select
                name="country"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="rounded-lg border border-border bg-bg px-md py-sm text-base text-text shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              >
                <option value="">{t('placeholders.country')}</option>
                {countryOptions.map(({ code, label }) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-start gap-sm rounded-lg border border-border bg-bg px-md py-sm">
            <input
              id="consent"
              type="checkbox"
              name="consent"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border"
              required
            />
            <label htmlFor="consent" className="text-sm text-text-muted leading-relaxed">
              {t('consentPrefix')}
              <Link href={`/${locale}/privacy`} prefetch={false} className="underline">
                {t('privacyLinkLabel')}
              </Link>
              {t('consentSuffix')}
            </label>
          </div>
          <p className="text-xs text-text-muted">{t('trustNote')}</p>
          <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
            <button type="submit" className={cn(buttons.primary, 'w-full md:w-auto')} disabled={submitting}>
              {submitting ? t('inflight') : t('submit')}
            </button>
            {message && (
              <p className={cn('text-sm', messageTone === 'error' ? 'text-status-danger' : 'text-status-success')} aria-live="polite">
                {message}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
