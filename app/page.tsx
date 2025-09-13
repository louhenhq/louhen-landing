'use client';

// app/page.tsx
import * as React from 'react';
import Link from 'next/link';
import { useEffect } from 'react';
import { getHeroVariant } from '@/lib/ab';
import { track } from '@/lib/analytics';
import { SITE_NAME, LEGAL_ENTITY } from '@/constants/site';

export default function WaitlistLanding() {
  const variant = typeof window !== 'undefined' ? getHeroVariant() : 'A';
  useEffect(() => {
    track({ name: 'page_view', path: '/', variant, ref: typeof document !== 'undefined' ? document.referrer || null : null });
  }, [variant]);

  const primaryLabel = variant === 'A' ? 'Join the waitlist' : 'Get early access';
  const secondaryLabel = variant === 'A' ? 'How it works' : 'See how it works';

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
          <Link
            href="/preferences"
            className="inline-flex items-center rounded-xl px-5 py-3 text-base font-medium bg-brand-primary text-white hover:opacity-90"
            prefetch={false}
            onClick={() => track({ name: 'cta_click', id: 'hero_primary', variant })}
          >
            {primaryLabel}
          </Link>
          <Link
            href="/onboarding/intro"
            className="inline-flex items-center rounded-xl px-5 py-3 text-base font-medium border border-border hover:border-border-strong"
            prefetch={false}
            onClick={() => track({ name: 'how_it_works_click' })}
          >
            {secondaryLabel}
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

// WaitlistForm moved to components/WaitlistForm
