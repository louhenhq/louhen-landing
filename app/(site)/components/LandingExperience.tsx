'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Header from '@/app/(site)/components/Header';
import Hero from '@/app/(site)/components/Hero';
import FounderStory from '@/app/(site)/components/FounderStory';
import HowItWorks from '@/app/(site)/components/HowItWorks';
import FAQ from '@/app/(site)/components/FAQ';
import Footer from '@/app/(site)/components/Footer';
import WaitlistForm from '@/components/waitlist/WaitlistForm';
import { layout } from '@/app/(site)/_lib/ui';
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
        <HowItWorks />
        <FounderStory />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
