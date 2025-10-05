'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { legalPath } from '@/lib/routing/legalPath';
import ThemeToggle from '@/components/ThemeToggle';
import { SITE_NAME } from '@/constants/site';

type Props = {
  onboardingEnabled?: boolean;
  legalEntity?: string;
};

export default function SiteHeader({ onboardingEnabled = false }: Props) {
  const locale = useLocale();
  const legalT = useTranslations('footer.legal');
  return (
    <header className="w-full border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Link href="/" className="font-semibold text-base md:text-lg">{SITE_NAME}</Link>
        </div>

        {/* Desktop nav */}
        <nav className="ml-auto hidden md:flex items-center gap-4">
          <Link href={legalPath(locale, 'privacy')} prefetch={false} className="text-sm hover:underline">{legalT('privacy')}</Link>
          <Link href={legalPath(locale, 'terms')} prefetch={false} className="text-sm hover:underline">{legalT('terms')}</Link>
          <Link href="/method" prefetch={false} className="text-sm hover:underline">Method</Link>
          <Link href="/imprint" prefetch={false} className="text-sm hover:underline">Imprint</Link>
          {onboardingEnabled && (
            <Link href="/onboarding/account" prefetch={false} className="text-sm hover:underline">
              Onboarding
            </Link>
          )}
          <Link href="/preferences" prefetch={false} className="hidden md:inline-flex rounded-xl px-4 py-2 bg-brand-primary text-white hover:opacity-90">
            Join the waitlist
          </Link>
          {/* Theme toggle visible on desktop */}
          <ThemeToggle />
        </nav>

        {/* Mobile menu button */}
        <div className="ml-auto md:hidden">
          {/* existing hamburger button */}
          {/* ... */}
        </div>
      </div>

      {/* Mobile dropdown / sheet / panel */}
      {/* Ensure your existing mobile panel renders nav links here */}
      <div className="md:hidden border-t border-slate-200">
        <nav className="px-4 py-3 flex flex-col gap-2">
          <Link href={legalPath(locale, 'privacy')} prefetch={false} className="text-sm underline">{legalT('privacy')}</Link>
          <Link href={legalPath(locale, 'terms')} prefetch={false} className="text-sm underline">{legalT('terms')}</Link>
          <Link href="/method" prefetch={false} className="text-sm underline">Method</Link>
          <Link href="/imprint" prefetch={false} className="text-sm underline">Imprint</Link>
          {onboardingEnabled && (
            <Link href="/onboarding/account" prefetch={false} className="text-sm underline">
              Onboarding
            </Link>
          )}
          {/* Theme toggle also available on mobile */}
          <div className="pt-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
