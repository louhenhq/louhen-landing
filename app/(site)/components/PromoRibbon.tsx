'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, useId, type MouseEvent as ReactMouseEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { recordHeaderEvent, type HeaderEventContext } from '@/lib/analytics/header';
import { resolvePromoRibbon, type PromoRibbonConfig } from '@/lib/header/ribbonConfig';
import { locales, defaultLocale, type SupportedLocale } from '@/next-intl.locales';
import { resolveInteractionTrigger } from '@/lib/analytics/interaction';

type PromoRibbonState = {
  config: PromoRibbonConfig;
  dismissed: boolean;
};

const STORAGE_PREFIX = 'lh_ribbon_dismissed_';

type PromoRibbonProps = {
  analyticsContext: HeaderEventContext;
};

function getStorageKey(config: PromoRibbonConfig, locale: string) {
  return `${STORAGE_PREFIX}${locale}_${config.id}`;
}

function findPostDismissFocusTarget(): HTMLElement | null {
  const desktopCta = document.querySelector<HTMLElement>('[data-testid="header-cta"]');
  if (desktopCta) return desktopCta;
  const mobileCta = document.querySelector<HTMLElement>('[data-testid="header-cta-mobile"]');
  if (mobileCta) return mobileCta;
  const skipLink = document.querySelector<HTMLElement>('[data-testid="header-skip-link"]');
  return skipLink ?? null;
}

export default function PromoRibbon({ analyticsContext }: PromoRibbonProps) {
  const locale = useLocale();
  const t = useTranslations();
  const supportedLocale: SupportedLocale = useMemo(() => {
    const candidate = locale as SupportedLocale;
    return locales.includes(candidate) ? candidate : defaultLocale;
  }, [locale]);
  const ribbonAnalyticsContext = useMemo<HeaderEventContext>(
    () => ({ ...analyticsContext, locale: supportedLocale }),
    [analyticsContext, supportedLocale]
  );
  const [state, setState] = useState<PromoRibbonState | null>(null);
  const focusTargetRef = useRef<HTMLElement | null>(null);
  const headingId = useId();

  useEffect(() => {
    const config = resolvePromoRibbon(supportedLocale);
    if (!config) {
      setState(null);
      return;
    }
    const key = getStorageKey(config, supportedLocale);
    const dismissed = typeof window !== 'undefined' && window.localStorage.getItem(key) === '1';
    setState({ config, dismissed });

    if (!dismissed) {
      const target = config.analyticsTarget ?? config.href ?? undefined;
      recordHeaderEvent(
        'header_ribbon_view',
        ribbonAnalyticsContext,
        {
          ribbonId: config.id,
          target,
          trigger: 'auto',
        },
        { surface: 'ribbon' }
      );
    }
  }, [supportedLocale, ribbonAnalyticsContext]);

  useEffect(() => {
    if (!state?.dismissed) return;
    const target = focusTargetRef.current;
    if (!target) return;
    requestAnimationFrame(() => {
      try {
        target.focus({ preventScroll: true });
      } catch {
        // ignore focus failures
      } finally {
        focusTargetRef.current = null;
      }
    });
  }, [state?.dismissed]);

  const handleDismiss = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      const trigger = resolveInteractionTrigger(event);
      setState((current) => {
        if (!current) return current;
        const key = getStorageKey(current.config, supportedLocale);
        try {
          window.localStorage.setItem(key, '1');
        } catch {
          // ignore
        }
        focusTargetRef.current = findPostDismissFocusTarget();
        recordHeaderEvent(
          'header_ribbon_dismiss',
          ribbonAnalyticsContext,
          {
            ribbonId: current.config.id,
            trigger,
          },
          { surface: 'ribbon' }
        );
        return { ...current, dismissed: true };
      });
    },
    [supportedLocale, ribbonAnalyticsContext]
  );

  const content = useMemo(() => {
    if (!state || state.dismissed) {
      return null;
    }
    const { config } = state;
    const baseKey = config.i18nKey as Parameters<typeof t>[0];
    const title = t(`${baseKey}.title`, { defaultMessage: t('header.ribbon.default.title') });
    const body = t(`${baseKey}.body`, { defaultMessage: t('header.ribbon.default.body') });
    const ctaLabel = config.href ? t(`${baseKey}.cta`, { defaultMessage: t('header.ribbon.default.cta') }) : null;
    const dismissLabel = t(`${baseKey}.dismiss`, { defaultMessage: t('header.ribbon.default.dismiss') });

    return { title, body, dismissLabel, href: config.href ?? null, ctaLabel, config };
  }, [state, t]);

  if (!state) {
    return <div className="min-h-[2.5rem]" aria-hidden="true" data-ribbon-placeholder />;
  }

  if (!content) {
    return <div className="min-h-[2.5rem]" aria-hidden="true" data-ribbon-placeholder />;
  }

  const { title, body, dismissLabel, href, ctaLabel, config } = content;
  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (!href) return;
    const target = config.analyticsTarget ?? href;
    const trigger = resolveInteractionTrigger(event);
    recordHeaderEvent(
      'header_ribbon_click',
      ribbonAnalyticsContext,
      {
        ribbonId: config.id,
        target,
        trigger,
      },
      { surface: 'ribbon' }
    );
  };

  return (
    <div
      className="flex min-h-[2.5rem] items-center justify-center border-b border-border bg-brand-primary/10 px-gutter py-2 text-sm text-text"
      data-ribbon
      data-ribbon-id={config.id}
      role="region"
      aria-labelledby={headingId}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-sm">
        <p id={headingId} className="font-medium text-text">
          <span className="mr-xs">{title}</span>
          <span className="text-text-muted">{body}</span>
        </p>
        {href && ctaLabel ? (
          <Link
            href={href}
            className="inline-flex items-center rounded-pill border border-brand-primary px-sm py-xs text-xs font-medium text-brand-primary transition-colors hover:bg-brand-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            onClick={handleClick}
            data-ribbon-cta
          >
            {ctaLabel}
          </Link>
        ) : null}
        <button
          type="button"
          className="ml-auto inline-flex items-center rounded-full border border-transparent px-sm py-xs text-xs text-text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          onClick={handleDismiss}
          data-ribbon-dismiss
        >
          {dismissLabel}
        </button>
      </div>
    </div>
  );
}
