'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/app/(site)/_lib/ui';

type TrustModalProps = {
  open: boolean;
  title: string;
  body: string;
  onClose: () => void;
  id: string;
};

function TrustModal({ open, title, body, onClose, id }: TrustModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusInitial = () => {
      const focusable = getFocusable(dialogRef.current);
      (focusable[0] ?? dialogRef.current)?.focus({ preventScroll: true });
    };

    const frame = requestAnimationFrame(focusInitial);

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;

      const focusable = getFocusable(root);
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !active || !root.contains(active)) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = 'hidden';

    document.addEventListener('keydown', handleKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKey);
      style.overflow = previousOverflow;
      const target = lastFocusRef.current;
      requestAnimationFrame(() => target?.focus({ preventScroll: true }));
    };
  }, [open, onClose]);

  if (!open) return null;

  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-bg/70 px-gutter"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn('w-full max-w-lg rounded-2xl border border-border bg-bg-card px-gutter py-xl shadow-card')}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="flex flex-col gap-md">
          <div className="flex items-start justify-between gap-sm">
            <h2 id={titleId} className="text-h3 text-text">
              {title}
            </h2>
            <button
              type="button"
              className="text-label text-text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              aria-label="Close"
              onClick={onClose}
            >
              ×
            </button>
          </div>
          <p id={descriptionId} className="text-body text-text-muted leading-relaxed">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TrustModal;

export { TrustModal };

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const selector =
    'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (node) => node.getAttribute('aria-hidden') !== 'true'
  );
}
