'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Header from '@/app/(site)/components/Header';
import Hero from '@/app/(site)/components/Hero';
import FAQ from '@/app/(site)/components/FAQ';
import Footer from '@/app/(site)/components/Footer';
import SiteShell from '@/app/(site)/components/SiteShell';
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
import { cn, layout, surfaces, text } from '@/app/(site)/_lib/ui';
import { track } from '@/lib/clientAnalytics';

export default function LandingExperience() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const toastT = useTranslations('waitlist.toast.confirmed');
  const layoutT = useTranslations('layout');
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
    <SiteShell
      header={<Header onCta={scrollToForm} />}
      footer={<Footer />}
      skipToMainLabel={layoutT('skipToMain')}
    >
      <SectionViewTracker />
      {showToast ? (
        <div className={cn(layout.container, 'mt-sm mb-lg')} role="status" aria-live="polite">
          <div className="rounded-2xl border border-status-success bg-status-success/10 px-md py-sm text-body-sm text-status-success shadow-card">
            <div className="flex items-start gap-sm">
              <div className="flex-1">
                <p className={cn(text.label, 'text-status-success')}>{toastT('title')}</p>
                <p className="mt-xs text-body-sm text-status-success/90">{toastT('body')}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowToast(false)}
                className="rounded-full border border-border px-sm py-xs text-label text-text transition-colors duration-base hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              >
                {toastT('dismiss')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Hero onJoinClick={scrollToForm} />

      <section id="waitlist" className={layout.section} aria-labelledby="waitlist-heading-section">
        <div className={cn(layout.container, layout.grid, 'items-start')}
        >
          <div className="md:col-span-7 lg:col-span-6">
            <WaitlistForm source={source ?? undefined} />
          </div>
          <div className="md:col-span-5 lg:col-span-5">
            <PodiatristBadge asSection={false} />
          </div>
        </div>
      </section>

      <section id="story" className={cn(layout.section, surfaces.subtle)}>
        <div className={cn(layout.container, layout.grid, 'items-start')}>
          <div className="overflow-hidden rounded-2xl md:col-span-5 lg:col-span-4">
            <FounderPhoto />
          </div>
          <div className="md:col-span-7 lg:col-span-6">
            <FounderStoryWithVoucher />
          </div>
        </div>
      </section>

      <HowItWorks />
      <TrustBar />
      <TestimonialCards />
      <PrivacyRibbon />
      <FAQ />
      <TrustSchema />
      <FaqTwinsVoucherSchema />
    </SiteShell>
  );
}
