'use client';

// app/page.tsx
import * as React from 'react';
import Link from 'next/link';
import { SITE_NAME, LEGAL_ENTITY } from '@/constants/site';
import { useSearchParams } from 'next/navigation';
type NavigatorWithShare = Navigator & { share?: (data: ShareData) => Promise<void> };

export default function WaitlistLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      {/* Header removed: now rendered globally via app/layout.tsx */}

      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Personal style. Effortless fit.
        </h1>
        <p className="mt-4 text-lg text-text-muted">
          Smarter sizing, curated looks from your favorite brands, and fit feedback that improves with every try.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/preferences" className="inline-flex items-center rounded-xl px-5 py-3 text-base font-medium bg-brand-primary text-white hover:opacity-90">
            Join the waitlist
          </Link>
          <Link href="/onboarding/intro" className="inline-flex items-center rounded-xl px-5 py-3 text-base font-medium border border-border hover:border-border-strong">
            How it works
          </Link>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 py-10">
        <div className="rounded-2xl border border-border p-6 bg-bg-card">
          <h3 className="text-lg font-semibold">Smart sizing</h3>
          <p className="mt-2 text-text-muted">Your size across brands with zero guesswork.</p>
        </div>
        <div className="rounded-2xl border border-border p-6 bg-bg-card">
          <h3 className="text-lg font-semibold">Curated looks</h3>
          <p className="mt-2 text-text-muted">Outfits you’ll actually wear, sourced from your favorites.</p>
        </div>
        <div className="rounded-2xl border border-border p-6 bg-bg-card">
          <h3 className="text-lg font-semibold">Better every time</h3>
          <p className="mt-2 text-text-muted">Fit feedback improves recommendations with each try.</p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-white border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">How {SITE_NAME} works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StepCard step="1" title="Scan or size">
              Use your phone to scan your child’s feet or enter simple measurements.
            </StepCard>
            <StepCard step="2" title="See perfect matches">
              Our sizing engine compares inner shoe dimensions, volume & shape.
            </StepCard>
            <StepCard step="3" title="Order with LouhenFit">
              Free returns + extra protection if the first pair doesn’t fit.
            </StepCard>
          </div>
        </div>
      </section>

      {/* Founder story */}
      <section id="story" className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-10 shadow-sm">
            <h3 className="text-xl font-semibold">Why we’re building {SITE_NAME}</h3>
            <p className="mt-4 text-slate-600 leading-relaxed">
              The idea was born buying our twins’ first shoes: a crowded store, long waits, two options measured only by length & width. We found a decent pair, but the experience felt stressful and limited. {SITE_NAME} lets parents shop at their own pace with confidence in fit and a wider choice of design and materials.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-2xl font-bold tracking-tight">Questions, answered</h3>
          <div className="mt-8 grid gap-4">
            <FaqItem q="Who is Louhen for?" a="Parents of children aged ~10 months to 6 years who want shoes that truly fit growing feet." />
            <FaqItem q="What is LouhenFit?" a="A simple promise: if the shoes don’t fit, we’ll make it right with free returns and extra protection." />
            <FaqItem q="How do referrals work?" a="Join the waitlist and you’ll receive a unique link. Invite friends; you both earn credit when they place their first order." />
            <FaqItem q="How do you handle my data?" a="We’re GDPR-first. We only collect what’s needed to match shoes to your child, never sell your data, and you’re always in control." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-sm text-slate-600 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <p className="text-sm text-text-muted">© {new Date().getFullYear()} {LEGAL_ENTITY}. All rights reserved.</p>
          {/* Legal links only — main navigation handled in SiteHeader */}
          <nav className="flex gap-6">
            <Link href="/privacy" prefetch={false} className="hover:opacity-70">Privacy</Link>
            <Link href="/terms" prefetch={false} className="hover:opacity-70">Terms</Link>
            <Link href="/imprint" prefetch={false} className="hover:opacity-70">Imprint</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-slate-900 text-white grid place-items-center text-sm font-semibold">{step}</div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-slate-600 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between">
        <span className="font-medium">{q}</span>
        <span className="ml-4 transition-transform group-open:rotate-180" aria-hidden>⌄</span>
      </summary>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{a}</p>
    </details>
  );
}

function WaitlistForm() {
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
        // Apply a client-side cooldown, respect server hint but ensure at least 5s
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
        // Gentle 5s cooldown on dupe to avoid spam clicking
        setCooldownUntil(Date.now() + 5000);
        return;
      }
      setStatus('ok');
      const extra = data?.refAccepted ? ' Referral applied — thanks for supporting your friend!' : '';
      setMessage('You’re on the list! We’ll email your unique referral link soon.' + extra);
      (e.target as HTMLFormElement).reset();
      setLocked(true);
      // Small cooldown after success to prevent accidental resubmits
      setCooldownUntil(Date.now() + 5000);
      // Build share link from returned code (e.g. /r/ABCDEFGH) + UTM params
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
      // Small cooldown after error to deter rapid retries
      setCooldownUntil(Date.now() + 5000);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm max-w-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="email" className="block text-sm font-medium">Email <span className="text-rose-600">*</span></label>
          <input id="email" name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium">First name</label>
          <input id="firstName" name="firstName" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900" />
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium">Country</label>
          <select id="country" name="country" defaultValue="DE" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900">
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
          <select id="ageBand" name="ageBand" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900">
            <option value="10-24m">10–24 months</option>
            <option value="2-4y">2–4 years</option>
            <option value="4-6y">4–6 years</option>
          </select>
        </div>
        <div>
          <label htmlFor="ref" className="block text-sm font-medium">Referral code (optional)</label>
          <input
            id="ref"
            name="ref"
            defaultValue={refFromUrl}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="e.g. LOUISE123"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium">Anything we should know? (optional)</label>
          <textarea id="notes" name="notes" rows={3} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900" placeholder="Tell us about your kid’s shoe needs" />
        </div>
        {/* Honeypot field (bot trap) */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" autoComplete="off" tabIndex={-1} />
        </div>
        <div className="sm:col-span-2 flex items-start gap-3">
          <input id="consent" name="consent" type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300" />
          <label htmlFor="consent" className="text-xs text-slate-600">I agree to receive early-access emails from Louhen and accept the <a href="/privacy" className="underline">Privacy Policy</a>. You can opt out anytime.</label>
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={status==='loading' || locked || inCooldown}
            className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:opacity-90 disabled:opacity-60"
            aria-disabled={status==='loading' || locked || inCooldown}
          >
            {status === 'loading'
              ? 'Joining…'
              : inCooldown
              ? `Please wait… ${remainingSec}s`
              : 'Join the waitlist'}
          </button>
          {message && (
            <div className="mt-3" aria-live="polite">
              <p
                className={`text-sm ${
                  status==='ok' ? 'text-emerald-700'
                  : status==='dupe' ? 'text-slate-700'
                  : status==='rate' ? 'text-amber-700'
                  : 'text-rose-600'
                }`}
              >
                {message}
              </p>
              {status==='ok' && process.env.NEXT_PUBLIC_ONBOARDING_ENABLED === 'true' && (
                <div className="mt-3">
                  <Link href="/onboarding/account" className="inline-block rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50 text-sm">
                    Continue onboarding
                  </Link>
                </div>
              )}
            </div>
          )}
          {status === 'ok' && shareLink && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-900">Invite friends</h4>
              <p className="mt-1 text-sm text-slate-600">
                Share your link and both of you earn credit when they place their first order.
              </p>
              <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
                <a
                  href={shareLink}
                  className="text-sm underline break-all sm:break-normal"
                >
                  {shareLink}
                </a>
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
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-white"
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
                          await nav.share({
                            title: 'Join me on Louhen',
                            text: 'Perfect fit for growing feet — join the waitlist:',
                            url: shareLink,
                          });
                        } else {
                          await navigator.clipboard.writeText(shareLink);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }
                      } catch {}
                    }}
                    className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm hover:opacity-90"
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
