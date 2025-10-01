'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { useMethodExperience } from './MethodExperienceProvider';

type ExitNudgeProps = {
  faqSelector: string;
};

export default function ExitNudge({ faqSelector }: ExitNudgeProps) {
  const { hasClickedCta, registerExitNudgeShown } = useMethodExperience();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const t = useTranslations('method.faqTeaser');

  const STORAGE_KEY = 'method-exit-nudge-dismissed';

  useEffect(() => {
    if (typeof window === 'undefined') {
      setStorageReady(true);
      return;
    }
    try {
      setDismissed(window.sessionStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      setDismissed(false);
    } finally {
      setStorageReady(true);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(STORAGE_KEY, '1');
      }
    } catch {
      // ignore storage failures
    }
    observerRef.current?.disconnect();
    const lastFocused = lastFocusedRef.current;
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus({ preventScroll: false });
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    if (dismissed || hasClickedCta) {
      setVisible(false);
      observerRef.current?.disconnect();
      return;
    }
    const target = document.querySelector(faqSelector);
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (hasClickedCta) return;
          const activeElement = document.activeElement;
          if (activeElement instanceof HTMLElement) {
            lastFocusedRef.current = activeElement;
          }
          setVisible(true);
          registerExitNudgeShown();
          observer.disconnect();
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(target);
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [dismissed, faqSelector, hasClickedCta, registerExitNudgeShown, storageReady]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleDismiss, visible]);

  if (!storageReady || !visible || dismissed) return null;

  return (
    <aside
      className={cn(layout.section, 'bg-brand-primary/5 py-4')}
      aria-live="polite"
      data-testid="method-exit-nudge"
    >
      <div className={cn(layout.container, 'flex flex-col gap-2 text-sm text-text md:flex-row md:items-center md:justify-between')}>
        <div>
          <span className={cn(text.eyebrow, 'text-brand-primary/80 block')}>{t('title')}</span>
          <p className="text-text-muted">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          className="mt-2 self-start rounded-md border border-border px-3 py-1 text-xs font-medium text-text transition hover:bg-border/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 md:mt-0"
          onClick={handleDismiss}
          aria-label={t('dismissAria')}
        >
          {t('dismiss')}
        </button>
      </div>
    </aside>
  );
}
