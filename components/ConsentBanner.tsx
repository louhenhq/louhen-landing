'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { loadFromCookie, onConsentChange, setConsent, type ConsentState } from '@/lib/shared/consent/api';

const BUTTON_CLASSES =
  'inline-flex items-center justify-center rounded-pill border px-md py-sm text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus';

const PRIMARY_BUTTON_CLASSES = `${BUTTON_CLASSES} bg-brand-primary text-white border-brand-primary hover:opacity-90`;
const SECONDARY_BUTTON_CLASSES = `${BUTTON_CLASSES} bg-bg-subtle text-text border-border hover:bg-bg`;
const TERTIARY_BUTTON_CLASSES =
  'inline-flex items-center justify-center rounded-pill px-md py-sm text-sm font-medium text-text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

type ConsentBannerProps = {
  forceOpen?: boolean;
  onClose?: () => void;
  onLearnMoreHref?: string;
};

export default function ConsentBanner({ forceOpen = false, onClose, onLearnMoreHref = '/legal/privacy' }: ConsentBannerProps) {
  const t = useTranslations('header.consent.manager');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastActiveElement = useRef<Element | null>(null);
  const [consentState, setConsentState] = useState<ConsentState>('unknown');
  const [internalOpen, setInternalOpen] = useState<boolean>(forceOpen);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initial = loadFromCookie();
    setConsentState(initial);
    if (initial === 'unknown') {
      setInternalOpen(true);
    }

    const unsubscribe = onConsentChange((next) => {
      setConsentState(next);
      if (next !== 'unknown') {
        setInternalOpen(false);
        onClose?.();
      }
    });
    return unsubscribe;
  }, [onClose]);

  useEffect(() => {
    if (forceOpen) {
      setInternalOpen(true);
      return;
    }
    if (consentState !== 'unknown') {
      setInternalOpen(false);
    }
  }, [forceOpen, consentState]);

  const open = useMemo(() => {
    if (forceOpen) return true;
    if (consentState === 'unknown') {
      return internalOpen;
    }
    return internalOpen && forceOpen;
  }, [forceOpen, consentState, internalOpen]);

  useEffect(() => {
    if (!open) return;
    lastActiveElement.current = typeof document !== 'undefined' ? document.activeElement : null;
    const firstButton = firstButtonRef.current;
    if (firstButton) {
      firstButton.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((node) => !node.hasAttribute('disabled'));
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (lastActiveElement.current instanceof HTMLElement) {
        lastActiveElement.current.focus({ preventScroll: true });
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-gutter py-xl"
      role="presentation"
      onClick={() => {
        setInternalOpen(false);
        onClose?.();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-manager-title"
        aria-describedby="consent-manager-description"
        className="w-full max-w-lg rounded-3xl border border-border bg-bg shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-sm border-b border-border px-lg py-md">
          <div>
            <h2 id="consent-manager-title" className="text-lg font-semibold text-text">
              {t('title')}
            </h2>
            <p id="consent-manager-description" className="mt-xs text-sm text-text-muted">
              {t('description')}
            </p>
          </div>
          <button
            type="button"
            className={TERTIARY_BUTTON_CLASSES}
            onClick={() => {
              setInternalOpen(false);
              onClose?.();
            }}
            aria-label={t('close')}
          >
            {t('close')}
          </button>
        </div>
        <div className="flex flex-col gap-sm px-lg py-lg">
          <button
            ref={firstButtonRef}
            type="button"
            className={PRIMARY_BUTTON_CLASSES}
            onClick={() => {
              setConsent('granted');
              setInternalOpen(false);
              onClose?.();
            }}
            data-consent-accept
          >
            {t('accept')}
          </button>
          <button
            type="button"
            className={SECONDARY_BUTTON_CLASSES}
            onClick={() => {
              setConsent('denied');
              setInternalOpen(false);
              onClose?.();
            }}
          >
            {t('reject')}
          </button>
          <Link className="text-sm font-medium text-brand-primary underline" href={onLearnMoreHref}>
            {t('settings')}
          </Link>
        </div>
      </div>
    </div>
  );
}
