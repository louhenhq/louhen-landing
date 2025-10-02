'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { cn, layout } from '@/app/(site)/_lib/ui';
import ThemeToggle from '@/components/ThemeToggle';
import LocaleSwitcher from '@/app/(site)/components/LocaleSwitcher';
import { usePrefersReducedMotion } from '@/app/(site)/_lib/usePrefersReducedMotion';

type HeaderProps = {
  onCta?: () => void;
};

export default function Header({ onCta }: HeaderProps) {
  const t = useTranslations('header');
  const [isElevated, setIsElevated] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      setIsElevated(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleScrollToForm() {
    const form = document.getElementById('waitlist-form');
    if (form) {
      const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
      form.scrollIntoView({ behavior, block: 'start' });
      const firstInput = form.querySelector('input, select, textarea, button') as HTMLElement | null;
      if (firstInput) firstInput.focus({ preventScroll: true });
    }
    onCta?.();
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-header border-b border-border/40 bg-bg/80 backdrop-blur-md transition-shadow duration-200 supports-[backdrop-filter]:bg-bg/60',
        isElevated ? 'shadow-elevated' : 'shadow-none'
      )}
    >
      <div className={cn(layout.container, 'flex h-[var(--layout-header-height)] items-center justify-between gap-sm')}>
        <Link href="/" prefetch={false} className="text-h3 text-text">
          {t('logo')}
        </Link>
        <nav className="hidden items-center gap-lg lg:flex" aria-label={t('nav.aria')}>
          <a className="text-label text-text-muted transition-colors hover:text-text" href="#how">
            {t('nav.how')}
          </a>
          <a className="text-label text-text-muted transition-colors hover:text-text" href="#story">
            {t('nav.story')}
          </a>
          <a className="text-label text-text-muted transition-colors hover:text-text" href="#faq">
            {t('nav.faq')}
          </a>
        </nav>
        <div className="flex items-center gap-sm">
          <ThemeToggle className="hidden lg:flex" />
          <Button className="hidden lg:inline-flex" onClick={handleScrollToForm}>
            {t('cta')}
          </Button>
          <LocaleSwitcher label={t('locale.label')} />
        </div>
      </div>
      <div className={cn(layout.container, 'pb-sm lg:hidden')}>
        <div className="flex items-center gap-sm">
          <Button className="flex-1" onClick={handleScrollToForm}>
            {t('cta')}
          </Button>
          <LocaleSwitcher id="locale-switcher-mobile" label={t('locale.label')} className="flex-shrink-0" />
        </div>
        <ThemeToggle className="mt-sm" />
      </div>
    </header>
  );
}
