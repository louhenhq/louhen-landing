'use client';

import * as React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import ThemeToggle from '@/components/ThemeToggle';
import { SITE_NAME } from '@/constants/site';
import { Button } from '@/components/ui';
import {
  FULL_LOCALES,
  buildPathForLocale,
  type AppLocale,
  DEFAULT_LOCALE,
} from '@/lib/i18n/locales';
import { legalPath } from '@lib/shared/routing/legal-path';

type Props = {
  onboardingEnabled?: boolean;
  legalEntity?: string;
};

export default function SiteHeader({ onboardingEnabled = false }: Props) {
  const rawLocale = useLocale();
  const activeLocale = (FULL_LOCALES.includes(rawLocale as AppLocale) ? (rawLocale as AppLocale) : DEFAULT_LOCALE.value) as AppLocale;
  const to = (pathname: string) => buildPathForLocale(activeLocale, pathname);

  return (
    <header className="w-full border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Link href={to('/')} className="text-h3 text-text">{SITE_NAME}</Link>
        </div>

        {/* Desktop nav */}
        <nav className="ml-auto hidden md:flex items-center gap-4">
          <Link
            href={legalPath(activeLocale, 'privacy')}
            prefetch={false}
            className="touch-target touch-padding inline-flex items-center justify-center text-label text-text hover:underline"
          >
            Privacy
          </Link>
          <Link
            href={legalPath(activeLocale, 'terms')}
            prefetch={false}
            className="touch-target touch-padding inline-flex items-center justify-center text-label text-text hover:underline"
          >
            Terms
          </Link>
          <Link
            href={to('/method')}
            prefetch={false}
            className="touch-target touch-padding inline-flex items-center justify-center text-label text-text hover:underline"
          >
            Method
          </Link>
          <Link
            href={to('/imprint')}
            prefetch={false}
            className="touch-target touch-padding inline-flex items-center justify-center text-label text-text hover:underline"
          >
            Imprint
          </Link>
          {onboardingEnabled && (
            <Link
              href={to('/onboarding/account')}
              prefetch={false}
              className="touch-target touch-padding inline-flex items-center justify-center text-label text-text hover:underline"
            >
              Onboarding
            </Link>
          )}
          <Link href={to('/preferences')} prefetch={false} passHref legacyBehavior>
            <Button as="a" className="hidden md:inline-flex">
              Join the waitlist
            </Button>
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
      <div className="md:hidden border-t border-border">
        <nav className="px-4 py-3 flex flex-col gap-2">
          <Link
            href={legalPath(activeLocale, 'privacy')}
            prefetch={false}
            className="touch-target touch-padding inline-flex items-center justify-start text-label text-text underline"
          >
            Privacy
          </Link>
          <Link
            href={legalPath(activeLocale, 'terms')}
            prefetch={false}
            className="touch-target touch-padding inline-flex items-center justify-start text-label text-text underline"
          >
            Terms
          </Link>
          <Link
            href={to('/method')}
            prefetch={false}
            className="touch-target touch-padding inline-flex items-center justify-start text-label text-text underline"
          >
            Method
          </Link>
          <Link
            href={to('/imprint')}
            prefetch={false}
            className="touch-target touch-padding inline-flex items-center justify-start text-label text-text underline"
          >
            Imprint
          </Link>
          {onboardingEnabled && (
            <Link
              href={to('/onboarding/account')}
              prefetch={false}
              className="touch-target touch-padding inline-flex items-center justify-start text-label text-text underline"
            >
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
