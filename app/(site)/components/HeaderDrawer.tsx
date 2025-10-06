'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { cn } from '@/app/(site)/_lib/ui';
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion';
import { useIntentPrefetch } from '@/lib/hooks/useIntentPrefetch';
import type { NavItemResolved } from '@/lib/nav/config';
import { recordHeaderEvent, type HeaderEventContext } from '@/lib/analytics/header';
import { resolveAnalyticsTarget } from '@/lib/url/analyticsTarget';
import { resolveInteractionTrigger } from '@/lib/analytics/interaction';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
const TRANSITION_MS = 200;

type DrawerNavItem = {
  item: NavItemResolved;
  label: string;
};

export type HeaderDrawerCloseReason = 'escape' | 'backdrop' | 'button' | 'nav' | 'cta' | 'system';

type HeaderDrawerProps = {
  open: boolean;
  onClose: (reason: HeaderDrawerCloseReason) => void;
  onNavigate: (item: NavItemResolved) => void;
  primary: DrawerNavItem[];
  secondary: DrawerNavItem[];
  analyticsContext: HeaderEventContext;
  localeControl: React.ReactNode;
  navLabel: string;
  title: string;
  closeLabel: string;
  drawerId: string;
  cta?: ReactNode;
};

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.hasAttribute('disabled')) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;
    return true;
  });
}

export default function HeaderDrawer({
  open,
  onClose,
  onNavigate,
  primary,
  secondary,
  analyticsContext,
  localeControl,
  navLabel,
  title,
  closeLabel,
  drawerId,
  cta,
}: HeaderDrawerProps) {
  const headingId = useId();
  const motionDisabled = usePrefersReducedMotion();
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    let frame: number | null = null;
    let timeout: number | null = null;

    if (open) {
      setShouldRender(true);
      frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else if (shouldRender) {
      setIsVisible(false);
      if (motionDisabled) {
        setShouldRender(false);
      } else {
        timeout = window.setTimeout(() => setShouldRender(false), TRANSITION_MS);
      }
    }

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, [open, motionDisabled, shouldRender]);

  useEffect(() => {
    if (!shouldRender) return undefined;
    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = 'hidden';
    return () => {
      style.overflow = previousOverflow;
    };
  }, [shouldRender]);

  useEffect(() => {
    if (!open || !shouldRender) return undefined;
    const panel = panelRef.current;
    if (!panel) return undefined;

    const focusFirstElement = () => {
      const focusable = getFocusableElements(panel);
      const target = headingRef.current ?? focusable[0] ?? panel;
      target.focus({ preventScroll: true });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const focusable = getFocusableElements(panel);
        if (focusable.length === 0) {
          event.preventDefault();
          panel.focus({ preventScroll: true });
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (event.shiftKey) {
          if (active === first || !panel.contains(active)) {
            event.preventDefault();
            last.focus({ preventScroll: true });
          }
        } else if (active === last) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose('escape');
      }
    };

    const frame = window.requestAnimationFrame(focusFirstElement);
    panel.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      panel.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  const drawerState = open ? 'open' : 'closed';
  const motionState = motionDisabled ? 'disabled' : 'enabled';

  return (
    <div
      className={cn(
        'fixed inset-0 z-header-drawer flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-base lg:hidden',
        motionDisabled ? 'transition-none opacity-100' : isVisible ? 'opacity-100' : 'opacity-0'
      )}
      role="presentation"
      onClick={() => onClose('backdrop')}
      data-drawer={drawerState}
      data-drawer-backdrop
      data-motion={motionState}
      data-drawer-dismiss="backdrop"
    >
      <div
        ref={panelRef}
        className={cn(
          'relative flex h-full w-full max-w-sm flex-col bg-bg shadow-lg transition-transform duration-base ease-out',
          motionDisabled ? 'transition-none translate-x-0' : isVisible ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        id={drawerId}
        tabIndex={-1}
        data-nav-drawer
        data-surface="drawer"
        data-motion={motionState}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-gutter py-md">
          <h2
            id={headingId}
            ref={headingRef}
            tabIndex={-1}
            className="text-base font-semibold text-text"
            data-testid="header-drawer-heading"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={() => onClose('button')}
            className="rounded-pill border border-border px-sm py-xs text-sm text-text hover:bg-bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            aria-label={closeLabel}
            data-nav-drawer-close
            data-drawer-dismiss="button"
          >
            {closeLabel}
          </button>
        </div>

        <nav aria-label={navLabel} className="flex-1 overflow-y-auto px-gutter pb-lg">
          <ul className="flex flex-col gap-md" data-nav-section="primary">
            {primary.map(({ item, label }) => (
              <li key={item.id}>
                <DrawerLink
                  item={item}
                  label={label}
                  onNavigate={onNavigate}
                  analyticsContext={analyticsContext}
                />
              </li>
            ))}
          </ul>

          {secondary.length > 0 ? (
            <div className="mt-xl border-t border-border pt-xl" data-nav-section="secondary">
              <ul className="flex flex-col gap-sm">
                {secondary.map(({ item, label }) => (
                  <li key={item.id}>
                    <DrawerLink
                      item={item}
                      label={label}
                      onNavigate={onNavigate}
                      analyticsContext={analyticsContext}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </nav>

        {localeControl ? (
          <div className="border-t border-border px-gutter py-lg" data-nav-section="system">
            {localeControl}
          </div>
        ) : null}
        {cta ? (
          <div className="border-t border-border px-gutter py-lg" data-nav-section="cta">
            {cta}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type DrawerLinkProps = {
  item: NavItemResolved;
  label: string;
  onNavigate: (item: NavItemResolved) => void;
  analyticsContext: HeaderEventContext;
};

function DrawerLink({ item, label, onNavigate, analyticsContext }: DrawerLinkProps) {
  const baseClasses = cn(
    'flex h-12 w-full items-center gap-sm rounded-pill border border-border bg-bg-subtle px-lg text-base font-medium text-text transition-colors duration-base hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus'
  );
  const analyticsTarget = useMemo(() => getNavAnalyticsTarget(item), [item]);
  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    const trigger = resolveInteractionTrigger(event);
    recordHeaderEvent(
      'header_nav_click',
      analyticsContext,
      {
        navId: item.id,
        target: analyticsTarget,
        trigger,
      },
      { surface: 'drawer' }
    );
    onNavigate(item);
  };
  const isAnchor = item.href.startsWith('#');
  const enableIntentPrefetch = !item.isExternal && !isAnchor;
  const prefetchHandlers = useIntentPrefetch(enableIntentPrefetch ? item.href : null, {
    enabled: enableIntentPrefetch,
  });
  const prefetchPolicyAttributes = enableIntentPrefetch
    ? ({ 'data-prefetch-policy': 'intent' } as const)
    : {};

  if (item.isExternal) {
    return (
      <a
        href={item.href}
        rel={item.rel ?? 'noopener noreferrer'}
        target={item.target ?? '_blank'}
        className={baseClasses}
        data-nav-id={item.id}
        data-analytics-event={item.analyticsEvent}
        data-surface="drawer"
        onClick={(event) => {
          handleClick(event);
        }}
      >
        {label}
      </a>
    );
  }

  if (isAnchor) {
    return (
      <a
        href={item.href}
        className={baseClasses}
        data-nav-id={item.id}
        data-analytics-event={item.analyticsEvent}
        data-surface="drawer"
        onClick={(event) => {
          handleClick(event);
        }}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      prefetch={item.prefetch ?? false}
      className={baseClasses}
      data-nav-id={item.id}
      data-analytics-event={item.analyticsEvent}
      data-surface="drawer"
      onClick={(event) => {
        handleClick(event);
      }}
      {...prefetchPolicyAttributes}
      {...prefetchHandlers}
    >
      {label}
    </Link>
  );
}

function getNavAnalyticsTarget(item: NavItemResolved): string | undefined {
  if (item.href.startsWith('#')) {
    return item.href;
  }
  return resolveAnalyticsTarget(item.href);
}
