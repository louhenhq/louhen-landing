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
import PodiatristBadge from '@/app/(site)/components/PodiatristBadge';
import TrustBar from '@/components/TrustBar';
import TestimonialCards from '@/components/TestimonialCards';
import PrivacyRibbon from '@/components/PrivacyRibbon';
import TrustSchema from '@/components/TrustSchema';
import WaitlistForm from '@/components/waitlist/WaitlistForm';
import { Button, Card } from '@/components/ui';
import { cn, layout, surfaces, text } from '@/app/(site)/_lib/ui';
import { track } from '@/lib/clientAnalytics';
import { usePrefersReducedMotion } from '@/app/(site)/_lib/usePrefersReducedMotion';

export default function LandingExperience() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const toastT = useTranslations('waitlist.toast.confirmed');
  const layoutT = useTranslations('layout');
  const waitlistAsideT = useTranslations('waitlist.form.reassurance');
  const prefersReducedMotion = usePrefersReducedMotion();
  const waitlistAsideItems = useMemo(() => {
    const raw = waitlistAsideT.raw('items');
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [waitlistAsideT]);
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
      const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
      form.scrollIntoView({ behavior, block: 'start' });
      const firstInput = form.querySelector('input, select, textarea, button') as HTMLElement | null;
      firstInput?.focus({ preventScroll: true });
    }
  }, [prefersReducedMotion]);

  return (
    <SiteShell
      header={<Header onCta={scrollToForm} />}
      footer={<Footer />}
      skipToMainLabel={layoutT('skipToMain')}
    >
      <SectionViewTracker />
      {showToast ? (
        <div className={cn(layout.container, 'mt-sm mb-lg')} role="status" aria-live="polite">
          <Card
            variant="outline"
            className="flex items-start gap-sm border-status-success bg-status-success/10 px-md py-sm text-body-sm text-status-success"
          >
            <div className="flex-1">
              <p className={cn(text.label, 'text-status-success')}>{toastT('title')}</p>
              <p className="mt-xs text-body-sm text-status-success/90">{toastT('body')}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowToast(false)}
              className="shrink-0 px-sm"
            >
              {toastT('dismiss')}
            </Button>
          </Card>
        </div>
      ) : null}

      <Hero onJoinClick={scrollToForm} />

      <TrustBar />

      <section
        id="waitlist"
        className={layout.section}
        aria-labelledby="waitlist-heading-section"
        data-testid="landing-waitlist-section"
      >
        <div className={cn(layout.container, layout.grid, 'items-start gap-y-xl')}>
          <div className="md:col-span-7 lg:col-span-6">
            <WaitlistForm headingId="waitlist-heading-section" source={source ?? undefined} className="h-full" />
          </div>
          <aside className="md:col-span-5 lg:col-span-5 flex flex-col gap-lg">
            <Card className="p-lg">
              <h3 className="text-h3 text-text">{waitlistAsideT('title')}</h3>
              <ul className="mt-sm list-disc space-y-sm pl-lg text-body-sm text-text-muted marker:text-border">
                {waitlistAsideItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
            <PodiatristBadge
              variant="tile"
              label={waitlistAsideT('podiatrist.title')}
              description={waitlistAsideT('podiatrist.body')}
              ariaLabel={waitlistAsideT('podiatrist.aria')}
            />
          </aside>
        </div>
      </section>

      <section id="story" className={cn(layout.section, surfaces.subtle)}>
        <div className={cn(layout.container, layout.grid, 'items-start')}>
          <div className="overflow-hidden rounded-2xl md:col-span-5 lg:col-span-4">
            <FounderPhoto priority />
          </div>
          <div className="md:col-span-7 lg:col-span-6">
            <FounderStoryWithVoucher />
          </div>
        </div>
      </section>

      <HowItWorks />
      <TestimonialCards />
      <PrivacyRibbon />
      <FAQ />
      <TrustSchema />
      <FaqTwinsVoucherSchema />
    </SiteShell>
  );
}
