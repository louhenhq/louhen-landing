'use client';

import { useMemo, type MouseEvent as ReactMouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useConsent } from '@components/ConsentProvider';
import { recordHeaderEvent, type HeaderEventContext } from '@lib/analytics/header';
import { resolveInteractionTrigger } from '@lib/analytics/interaction';
import type { HeaderConsentState, HeaderSurface } from '@lib/analytics.schema';

type HeaderConsentButtonProps = {
  variant: 'desktop' | 'mobile';
  analyticsContext: HeaderEventContext;
  surface?: HeaderSurface;
  onOpen?: () => void;
};

export default function HeaderConsentButton({ variant, analyticsContext, surface, onOpen }: HeaderConsentButtonProps) {
  const t = useTranslations('header');
  const { consent, openManager } = useConsent();

  const state = useMemo<HeaderConsentState>(() => {
    if (!consent) return 'unset';
    return consent.analytics ? 'granted' : 'denied';
  }, [consent]);

  const surfaceValue: HeaderSurface = surface ?? (variant === 'desktop' ? 'header' : 'drawer');

  const buttonClass = variant === 'desktop'
    ? 'inline-flex h-11 items-center gap-xs rounded-pill border border-border bg-bg px-sm text-sm font-medium text-text hover:bg-bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus'
    : 'inline-flex w-full items-center justify-between rounded-2xl border border-border bg-bg px-md py-sm text-sm font-medium text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus';

  const label = t('consent.label');
  const statusLabel = t(`consent.state.${state}` as const);

  return (
    <button
      type="button"
      className={buttonClass}
      onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
        const trigger = resolveInteractionTrigger(event);
        recordHeaderEvent(
          'header_consent_open',
          analyticsContext,
          {
            state,
            trigger,
          },
          { surface: surfaceValue }
        );
        onOpen?.();
        openManager();
      }}
      data-consent-state={state}
      data-testid={variant === 'desktop' ? 'lh-nav-consent-button-desktop' : 'lh-nav-consent-button-mobile'}
    >
      <span className="flex items-center gap-xs">
        <span className="inline-flex h-2.5 w-2.5 rounded-full"
          aria-hidden="true"
          data-consent-indicator
          style={{
            backgroundColor: state === 'granted' ? 'var(--semantic-color-status-success)' : state === 'denied' ? 'var(--semantic-color-status-error)' : 'var(--semantic-color-status-neutral, var(--semantic-color-border))',
          }}
        />
        <span>{label}</span>
      </span>
      <span className="text-xs text-text-muted">{statusLabel}</span>
    </button>
  );
}
