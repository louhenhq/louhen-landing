'use client';

import { useCallback, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Header from '@/app/(site)/components/Header';
import Hero from '@/app/(site)/components/Hero';
import FounderStory from '@/app/(site)/components/FounderStory';
import HowItWorks from '@/app/(site)/components/HowItWorks';
import FAQ from '@/app/(site)/components/FAQ';
import Footer from '@/app/(site)/components/Footer';
import WaitlistForm from '@/app/(site)/components/WaitlistForm';
import { layout } from '@/app/(site)/_lib/ui';
import { track } from '@/lib/analytics';

export default function LandingExperience() {
  const locale = useLocale();

  useEffect(() => {
    const path = typeof window !== 'undefined' ? window.location.href : '/';
    const ref = typeof document !== 'undefined' ? document.referrer || null : null;
    track({ name: 'wl_view', locale, path, ref });
  }, [locale]);

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
        <Hero onJoinClick={scrollToForm} />
        <WaitlistForm />
        <HowItWorks />
        <FounderStory />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
