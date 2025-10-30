'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

type ConsentBannerProps = {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onManage: () => void;
};

export function ConsentBanner({ open, onAccept, onDecline, onManage }: ConsentBannerProps) {
  const t = useTranslations('consent.banner');
  const acceptRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      acceptRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (!open) return null;

  const regionLabel = t('title');

  return (
    <div
      role="region"
      aria-label={regionLabel}
      aria-live="polite"
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-[1200] flex justify-center px-gutter pb-gutter"
      data-testid="lh-consent-banner"
    >
      <div className="pointer-events-auto w-full max-w-3xl rounded-3xl border border-border bg-bg shadow-card">
        <div className="flex flex-col gap-md px-lg py-lg">
          <div className="flex flex-col gap-xs">
            <p className="text-label font-semibold text-text">{t('title')}</p>
            <p className="text-body text-text-muted">{t('body')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-sm">
            <button
              ref={acceptRef}
              type="button"
              className="inline-flex items-center gap-xs rounded-pill bg-brand-primary px-lg py-sm text-label text-brand-onPrimary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              data-consent-accept
              onClick={onAccept}
            >
              {t('accept')}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-xs rounded-pill border border-border px-lg py-sm text-label text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              onClick={onDecline}
            >
              {t('decline')}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-xs rounded-pill px-lg py-sm text-label text-text-muted underline-offset-4 transition-colors hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              onClick={onManage}
            >
              {t('manage')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ConsentManagerDialogProps = {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  learnMoreHref?: string;
};

export function ConsentManagerDialog({
  open,
  onClose,
  onAccept,
  onDecline,
  learnMoreHref = '/legal/privacy',
}: ConsentManagerDialogProps) {
  const t = useTranslations('header.consent.manager');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusInitial = () => {
      const focusable = getFocusable(containerRef.current);
      (firstButtonRef.current ?? focusable[0] ?? containerRef.current)?.focus({ preventScroll: true });
    };

    const frame = requestAnimationFrame(focusInitial);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const root = containerRef.current;
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

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      const target = lastFocusRef.current;
      requestAnimationFrame(() => target?.focus({ preventScroll: true }));
    };
  }, [open, onClose]);

  if (!open) return null;

  const titleId = 'consent-manager-title';
  const descriptionId = 'consent-manager-description';

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/60 px-gutter py-xl"
      role="presentation"
      onClick={onClose}
      data-testid="lh-consent-dialog-backdrop"
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-lg rounded-3xl border border-border bg-bg shadow-card"
        onClick={(event) => event.stopPropagation()}
        tabIndex={-1}
        data-testid="lh-consent-dialog"
      >
        <div className="flex items-start justify-between gap-sm border-b border-border px-lg py-md">
          <div>
            <h2 id={titleId} className="text-label font-semibold text-text">
              {t('title')}
            </h2>
            <p id={descriptionId} className="mt-xs text-body-sm text-text-muted">
              {t('description')}
            </p>
          </div>
          <button
            type="button"
            className="rounded-pill border border-border px-sm py-xs text-sm text-text hover:bg-bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            aria-label={t('close')}
            onClick={onClose}
          >
            {t('close')}
          </button>
        </div>
        <div className="flex flex-col gap-sm px-lg py-lg">
          <button
            ref={firstButtonRef}
            type="button"
            className="inline-flex items-center justify-center rounded-pill bg-brand-primary px-lg py-sm text-label text-brand-onPrimary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            data-testid="lh-consent-accept-all"
            onClick={onAccept}
          >
            {t('accept')}
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-pill border border-border px-lg py-sm text-label text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            onClick={onDecline}
          >
            {t('reject')}
          </button>
          <Link
            className="text-body-sm font-medium text-brand-primary underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            href={learnMoreHref}
          >
            {t('settings')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const selector =
    'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (node) => node.getAttribute('aria-hidden') !== 'true'
  );
}
