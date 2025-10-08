'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

const BUTTON_CLASSES =
  'inline-flex items-center justify-center rounded-pill border px-md py-sm text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus';

const PRIMARY_BUTTON_CLASSES = `${BUTTON_CLASSES} bg-brand-primary text-white border-brand-primary hover:opacity-90`;
const SECONDARY_BUTTON_CLASSES = `${BUTTON_CLASSES} bg-bg-subtle text-text border-border hover:bg-bg`;
const TERTIARY_BUTTON_CLASSES =
  'inline-flex items-center justify-center rounded-pill px-md py-sm text-sm font-medium text-text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

type ConsentBannerProps = {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
  onLearnMoreHref?: string;
};

export default function ConsentBanner({ open, onAccept, onReject, onClose, onLearnMoreHref = '/legal/privacy' }: ConsentBannerProps) {
  const t = useTranslations('header.consent.manager');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastActiveElement = useRef<Element | null>(null);

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
        onClose();
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-gutter py-xl" role="presentation" onClick={onClose}>
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
            onClick={onClose}
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
            onClick={onAccept}
            data-consent-accept
          >
            {t('accept')}
          </button>
          <button type="button" className={SECONDARY_BUTTON_CLASSES} onClick={onReject}>
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
