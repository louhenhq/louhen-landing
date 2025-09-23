'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

const BUTTON_CLASSES =
  'inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border focus-visible:ring-0';

const PRIMARY_BUTTON_CLASSES = `${BUTTON_CLASSES} bg-brand-primary text-white border-brand-primary hover:opacity-90`;
const SECONDARY_BUTTON_CLASSES = `${BUTTON_CLASSES} bg-white text-text border-border hover:bg-slate-100`;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

type ConsentBannerProps = {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
  onLearnMoreHref?: string;
};

export default function ConsentBanner({ open, onAccept, onReject, onLearnMoreHref = '/method' }: ConsentBannerProps) {
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
        onReject();
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

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

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
  }, [open, onReject]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-banner-title"
      aria-describedby="consent-banner-description"
      className="fixed inset-x-0 bottom-0 z-[999] bg-white/95 backdrop-blur shadow-2xl"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex-1 text-sm text-slate-700">
          <p id="consent-banner-title" className="text-base font-semibold text-slate-900">
            We use cookies to improve your experience
          </p>
          <p id="consent-banner-description" className="mt-1 text-sm">
            Louhen uses essential cookies to run the site and optional analytics to learn what helps families most.
            You can change your choice any time.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <button
            ref={firstButtonRef}
            type="button"
            className={PRIMARY_BUTTON_CLASSES}
            onClick={onAccept}
            data-consent-accept
          >
            Accept all
          </button>
          <button type="button" className={SECONDARY_BUTTON_CLASSES} onClick={onReject}>
            Reject non-essential
          </button>
          <Link className="text-sm font-medium text-brand-primary underline" href={onLearnMoreHref}>
            Learn about our Method
          </Link>
        </div>
      </div>
    </div>
  );
}
