'use client';

import * as React from 'react';
import Link from 'next/link';
import { SITE_NAME } from '@/constants/site';

type SiteHeaderProps = {
  onboardingEnabled?: boolean;
  legalEntity?: string; // reserved for future use
};

export default function SiteHeader({ onboardingEnabled = false }: SiteHeaderProps) {
  const [open, setOpen] = React.useState(false);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-slate-900" aria-hidden />
          <span className="font-semibold tracking-tight">{SITE_NAME}</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#how" className="hover:opacity-70">How it works</a>
          <a href="#story" className="hover:opacity-70">Founder story</a>
          <a href="#faq" className="hover:opacity-70">FAQ</a>
          {onboardingEnabled && (
            <Link href="/onboarding/account" className="hover:opacity-70">Onboarding</Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Open menu"
          aria-controls="mobile-menu"
          aria-expanded={open ? 'true' : 'false'}
          className="md:hidden inline-flex items-center justify-center rounded-lg border border-slate-300 p-2"
          onClick={() => setOpen(o => !o)}
        >
          <span aria-hidden>☰</span>
        </button>
      </div>

      {/* Mobile dropdown */}
      <div
        id="mobile-menu"
        className={`md:hidden border-t border-slate-200 bg-white/90 backdrop-blur ${open ? '' : 'hidden'}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3 text-sm">
          <a href="#how" className="hover:opacity-70" onClick={closeMenu}>How it works</a>
          <a href="#story" className="hover:opacity-70" onClick={closeMenu}>Founder story</a>
          <a href="#faq" className="hover:opacity-70" onClick={closeMenu}>FAQ</a>
          {onboardingEnabled && (
            <Link href="/onboarding/account" className="hover:opacity-70" onClick={closeMenu}>
              Onboarding
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
