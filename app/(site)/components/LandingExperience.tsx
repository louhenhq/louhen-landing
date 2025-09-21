'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Header from '@/app/(site)/components/Header';
import Hero from '@/app/(site)/components/Hero';
import FAQ from '@/app/(site)/components/FAQ';
import Footer from '@/app/(site)/components/Footer';
import SectionViewTracker from '@/components/SectionViewTracker';
import FounderStoryWithVoucher from '@/components/FounderStoryWithVoucher';
import FaqTwinsVoucherSchema from '@/components/FaqTwinsVoucherSchema';
import HowItWorks from '@/components/HowItWorks';
import FounderPhoto from '@/components/FounderPhoto';
import PodiatristBadge from '@/components/PodiatristBadge';
import TrustBar from '@/components/TrustBar';
import TestimonialCards from '@/components/TestimonialCards';
import PrivacyRibbon from '@/components/PrivacyRibbon';
import TrustSchema from '@/components/TrustSchema';
import WaitlistForm from '@/components/waitlist/WaitlistForm';
import { layout, surfaces } from '@/app/(site)/_lib/ui';
import { track } from '@/lib/clientAnalytics';

export default function LandingExperience() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const toastT = useTranslations('waitlist.toast.confirmed');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const path = typeof window !== 'undefined' ? window.location.href : '/';
    const ref = typeof document !== 'undefined' ? document.referrer || null : null;
    track({ name: 'wl_view', locale, path, ref });
  }, [locale]);

  useEffect(() => {
    if (!searchParams) return;
    if (searchParams.get('confirmed') === '1') {
      setShowToast(true);
      track({ name: 'waitlist_confirm_toast_view' });
    }
  }, [searchParams]);

  const source = useMemo(() => {
    if (!searchParams) return null;
    const utmSource = searchParams.get('utm_source');
    if (utmSource) return utmSource;
    return searchParams.get('source');
  }, [searchParams]);

  const scrollToForm = useCallback(() => {
    const form = document.getElementById('waitlist-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = form.querySelector('input, select, textarea, button') as HTMLElement | null;
      firstInput?.focus({ preventScroll: true });
    }
  }, []);

  return (
    <div className={layout.page}>
      <Header onCta={scrollToForm} />
      <main>
        <SectionViewTracker />
        {showToast ? (
          <div className="mx-auto mb-lg w-full max-w-3xl px-gutter" role="status" aria-live="polite">
            <div className="rounded-2xl border border-status-success bg-status-success/10 px-md py-sm text-sm text-status-success shadow-card">
              <div className="flex items-start gap-sm">
                <div className="flex-1">
                  <p className="font-semibold text-status-success">{toastT('title')}</p>
                  <p className="mt-xs text-status-success/90">{toastT('body')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowToast(false)}
                  className="rounded-full border border-border px-sm py-xs text-xs text-text transition-colors duration-base hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                >
                  {toastT('dismiss')}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        <Hero onJoinClick={scrollToForm} />
        <WaitlistForm source={source ?? undefined} />
        <section className={`${layout.section} ${surfaces.subtle}`}>
          <div className={`${layout.container} grid gap-8 md:grid-cols-2 md:items-start`}>
            <div className="overflow-hidden rounded-2xl">
              <FounderPhoto />
            </div>
            <FounderStoryWithVoucher />
          </div>
        </section>
        <HowItWorks />
        <PodiatristBadge />
        <TrustBar />
        <TestimonialCards />
        <PrivacyRibbon />
        <FAQ />
        <TrustSchema />
        <FaqTwinsVoucherSchema />
      </main>
      <Footer />
    </div>
  );
}
