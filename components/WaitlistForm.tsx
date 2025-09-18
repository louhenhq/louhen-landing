'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';

type NavigatorWithShare = Navigator & { share?: (data: ShareData) => Promise<void> };

export default function WaitlistForm() {
  const locale = useLocale();
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'ok' | 'error' | 'dupe' | 'rate'>('idle');
  const [message, setMessage] = React.useState<string>('');
  const [locked, setLocked] = React.useState<boolean>(false);
  const [cooldownUntil, setCooldownUntil] = React.useState<number | null>(null);
  const [now, setNow] = React.useState<number>(() => Date.now());
  const [shareLink, setShareLink] = React.useState<string>('');
  const [copied, setCopied] = React.useState<boolean>(false);
  const canWebShare = typeof navigator !== 'undefined' && typeof (navigator as NavigatorWithShare).share === 'function';
  const search = useSearchParams();
  const refFromUrl = (search.get('ref') || '').toUpperCase();
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remainingMs = cooldownUntil ? Math.max(0, cooldownUntil - now) : 0;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const inCooldown = remainingMs > 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inCooldown) {
      setStatus('rate');
      setMessage(`Please wait ~${remainingSec}s before trying again.`);
      return;
    }
    setStatus('loading');
    setMessage('');

    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    if (!fd.get('consent')) {
      setStatus('error');
      setMessage('Please accept the privacy consent to continue.');
      return;
    }

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        let retryAfterText = '';
        let retryAfterMs = 0;
        try {
          const data = await res.json();
          if (data?.retryAfterMs) {
            retryAfterMs = Number(data.retryAfterMs) || 0;
            const secs = Math.ceil(retryAfterMs / 1000);
            retryAfterText = ` Please try again in ~${secs}s.`;
          }
        } catch {}
        setStatus('rate');
        setMessage('Too many attempts in a short time.' + retryAfterText);
        const minMs = 5000;
        const cd = Math.max(minMs, retryAfterMs || 0);
        setCooldownUntil(Date.now() + cd);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      if (data?.dupe) {
        setStatus('dupe');
        setMessage('You’re already on the list — thanks for your enthusiasm!');
        setCooldownUntil(Date.now() + 5000);
        return;
      }
      setStatus('ok');
      const extra = data?.refAccepted ? ' Referral applied — thanks for supporting your friend!' : '';
      setMessage('You’re on the list! We’ll email your unique referral link soon.' + extra);
      (e.target as HTMLFormElement).reset();
      setLocked(true);
      setCooldownUntil(Date.now() + 5000);
      if (data?.code && typeof window !== 'undefined') {
        const origin = window.location.origin;
        const codeUpper = String(data.code).toUpperCase();
        const url = new URL(`/r/${codeUpper}`, origin);
        url.searchParams.set('utm_source', 'referral');
        url.searchParams.set('utm_medium', 'waitlist');
        url.searchParams.set('utm_campaign', 'prelaunch');
        url.searchParams.set('utm_content', codeUpper);
        setShareLink(url.toString());
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again or email hello@louhen.com');
      setCooldownUntil(Date.now() + 5000);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-bg-card p-5 sm:p-6 shadow-sm w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="email" className="block text-sm font-medium">Email <span className="text-rose-600">*</span></label>
          <input id="email" name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium">First name</label>
          <input id="firstName" name="firstName" className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium">Country</label>
          <select id="country" name="country" defaultValue="DE" className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary">
            <option value="DE">Germany</option>
            <option value="AT">Austria</option>
            <option value="NL">Netherlands</option>
            <option value="FR">France</option>
            <option value="IT">Italy</option>
            <option value="ES">Spain</option>
            <option value="OTHER">Other EU</option>
          </select>
        </div>
        <div>
          <label htmlFor="ageBand" className="block text-sm font-medium">Child age band</label>
          <select id="ageBand" name="ageBand" className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary">
            <option value="10-24m">10–24 months</option>
            <option value="2-4y">2–4 years</option>
            <option value="4-6y">4–6 years</option>
          </select>
        </div>
        <div>
          <label htmlFor="ref" className="block text-sm font-medium">Referral code (optional)</label>
          <input id="ref" name="ref" defaultValue={refFromUrl} className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="e.g. LOUISE123" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium">Anything we should know? (optional)</label>
          <textarea id="notes" name="notes" rows={3} className="mt-1 w-full rounded-xl border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Tell us about your style needs" />
        </div>
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" autoComplete="off" tabIndex={-1} />
        </div>
        <div className="sm:col-span-2 flex items-start gap-3">
          <input id="consent" name="consent" type="checkbox" className="mt-1 h-4 w-4 rounded border-border" />
          <label htmlFor="consent" className="text-xs text-text-muted">
            I agree to receive early-access emails from Louhen and accept the{' '}
            <Link href={`/${locale}/privacy`} className="underline" prefetch={false}>
              Privacy Policy
            </Link>
            . You can opt out anytime.
          </label>
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={status==='loading' || locked || inCooldown}
            className="w-full rounded-xl bg-brand-primary text-white py-3 font-semibold hover:opacity-90 disabled:opacity-60"
            aria-disabled={status==='loading' || locked || inCooldown}
          >
            {status === 'loading' ? 'Joining…' : inCooldown ? `Please wait… ${remainingSec}s` : 'Join the waitlist'}
          </button>
          {message && (
            <div className="mt-3" aria-live="polite">
              <p className={`text-sm ${status==='ok' ? 'text-emerald-700' : status==='dupe' ? 'text-text' : status==='rate' ? 'text-amber-700' : 'text-rose-600'}`}>{message}</p>
              {status==='ok' && (
                <div className="mt-3">
                  <Link href="/onboarding/account" className="inline-block rounded-xl border border-border px-4 py-2 hover:bg-bg">Continue onboarding</Link>
                </div>
              )}
            </div>
          )}
          {status === 'ok' && shareLink && (
            <div className="mt-6 rounded-xl border border-border bg-bg p-4">
              <h4 className="text-sm font-semibold">Invite friends</h4>
              <p className="mt-1 text-sm text-text-muted">Share your link and both of you earn credit when they place their first order.</p>
              <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
                <a href={shareLink} className="text-sm underline break-all sm:break-normal">{shareLink}</a>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareLink);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      } catch {}
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-bg"
                    aria-label="Copy referral link"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const nav = navigator as NavigatorWithShare;
                        if (typeof nav.share === 'function') {
                          await nav.share({ title: 'Join me on Louhen', text: 'Personal style. Effortless fit — join the waitlist:', url: shareLink });
                        } else {
                          await navigator.clipboard.writeText(shareLink);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }
                      } catch {}
                    }}
                    className="rounded-lg bg-brand-primary text-white px-3 py-1.5 text-sm hover:opacity-90"
                    aria-label="Share referral link"
                  >
                    {canWebShare ? 'Share' : 'Copy link'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
