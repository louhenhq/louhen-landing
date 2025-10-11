'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { buttons, cn, focusRing } from '@app/(site)/_lib/ui';
import HeaderDrawer, { type HeaderDrawerCloseReason } from './HeaderDrawer';
import HeaderLocaleSwitcher from './HeaderLocaleSwitcher';
import HeaderThemeToggle from './HeaderThemeToggle';
import HeaderConsentButton from './HeaderConsentButton';
import PromoRibbon from './PromoRibbon';
import { resolveLogoutUrl, type HeaderUserState } from '@lib/auth/userState';
import { buildHeaderCta, type HeaderCtaConfig } from '@lib/header/ctaConfig';
import { recordHeaderEvent, type HeaderEventContext } from '@lib/analytics/header';
import { buildHeaderNavigation, type NavItemResolved } from '@lib/nav/config';
import { localeHomePath } from '@lib/shared/routing/legal-path';
import { locales, defaultLocale, type SupportedLocale } from '@/next-intl.locales';
import { useScrollHeaderState } from '@lib/header/useScrollHeaderState';
import { usePrefersReducedMotion } from '@lib/hooks/usePrefersReducedMotion';
import { useIntentPrefetch } from '@lib/hooks/useIntentPrefetch';
import { resolveAnalyticsTarget } from '@lib/url/analyticsTarget';
import { resolveInteractionTrigger } from '@lib/analytics/interaction';
import type { HeaderSurface } from '@lib/analytics.schema';

type HeaderProps = {
  onCta?: () => void;
  userState?: HeaderUserState;
};

const DRAWER_ID = 'header-mobile-drawer';

export default function Header({ onCta, userState: userStateProp }: HeaderProps) {
  const t = useTranslations('header');
  const locale = useLocale();
  const activeLocale: SupportedLocale = locales.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : defaultLocale;
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const userState: HeaderUserState = userStateProp ?? 'guest';
  const navigation = useMemo(() => buildHeaderNavigation(activeLocale), [activeLocale]);
  const ctaConfig = useMemo<HeaderCtaConfig>(() => buildHeaderCta(activeLocale, { userState }), [activeLocale, userState]);
  const homeHref = useMemo(() => localeHomePath(activeLocale), [activeLocale]);
  const brandTarget = useMemo(() => resolveAnalyticsTarget(homeHref), [homeHref]);
  const availableSystemControls = navigation.system.filter((control) => control.status === 'available');
  const lockVisibility = hasFocusWithin || drawerOpen;
  const scrollState = useScrollHeaderState({
    disabled: prefersReducedMotion,
    lockVisibility,
  });
  const headerState = scrollState.state;
  const motionEnabled = !prefersReducedMotion;
  const shouldApplyWillChange = motionEnabled && headerState !== 'default';
  const analyticsContext = useMemo<HeaderEventContext>(
    () => ({ locale: activeLocale, mode: ctaConfig.mode, userState }),
    [activeLocale, ctaConfig.mode, userState]
  );

  const primaryNavItems = useMemo(
    () => navigation.primary.map((item) => ({ item, label: t(item.i18nKey) })),
    [navigation, t]
  );
  const secondaryNavItems = useMemo(
    () => navigation.secondary.map((item) => ({ item, label: t(item.i18nKey) })),
    [navigation, t]
  );

  const handleDrawerOpen = (trigger: HeaderDrawerCloseReason = 'button') => {
    if (drawerOpen) return;
    setDrawerOpen(true);
    recordHeaderEvent('header_open_drawer', analyticsContext, { trigger }, { surface: 'drawer' });
  };

  const closeDrawer = (
    reason: HeaderDrawerCloseReason,
    options: { restoreFocus?: boolean } = {}
  ) => {
    if (!drawerOpen) return;
    setDrawerOpen(false);
    recordHeaderEvent('header_close_drawer', analyticsContext, { trigger: reason }, { surface: 'drawer' });

    const shouldRestoreFocus = options.restoreFocus ?? !['nav', 'cta', 'system'].includes(reason);
    if (shouldRestoreFocus) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus({ preventScroll: true });
      });
    }
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const handleFocusIn = () => setHasFocusWithin(true);
    const handleFocusOut = (event: FocusEvent) => {
      const related = event.relatedTarget as Node | null;
      if (related && node.contains(related)) {
        return;
      }
      requestAnimationFrame(() => {
        const active = document.activeElement;
        if (active && node.contains(active)) {
          setHasFocusWithin(true);
        } else {
          setHasFocusWithin(false);
        }
      });
    };

    node.addEventListener('focusin', handleFocusIn);
    node.addEventListener('focusout', handleFocusOut);

    return () => {
      node.removeEventListener('focusin', handleFocusIn);
      node.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  function handleScrollToForm() {
    const form = document.getElementById('waitlist-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = form.querySelector('input, select, textarea, button') as HTMLElement | null;
      if (firstInput) firstInput.focus({ preventScroll: true });
    }
    onCta?.();
  }

  const hasLocaleSwitcher = availableSystemControls.some((control) => control.type === 'locale-switcher');

  const drawerNavLabel = t('drawer.navLabel');
  const drawerTitle = t('drawer.title');
  const drawerCloseLabel = t('drawer.close');
  const menuButtonLabel = t('drawer.open');

  const ctaLabel = t(ctaConfig.labelKey as Parameters<typeof t>[0]);
  const skipLinkLabel = t('skipLink');
  const showAuthLinks = userState === 'hinted';
  const logoutHref = useMemo(() => resolveLogoutUrl(), []);
  const logoutLabel = t('auth.logout');
  const hasThemeToggle = availableSystemControls.some((control) => control.type === 'theme-toggle');
  const hasConsentButton = availableSystemControls.some((control) => control.type === 'consent-manager');

  return (
    <header
      ref={headerRef}
      role="banner"
      data-header-state={headerState}
      data-motion={motionEnabled ? 'enabled' : 'disabled'}
      data-ll="nav-root"
      data-testid="lh-nav-root"
      className={cn(
        'group/header sticky top-0 z-header border-b border-border/60 bg-bg/90 backdrop-blur translate-y-0 transform-gpu transition-transform duration-base',
        'data-[header-state=hidden]:-translate-y-full',
        'data-[motion=disabled]:translate-y-0 data-[motion=disabled]:transition-none'
      )}
      style={{ willChange: shouldApplyWillChange ? 'transform' : undefined }}
    >
      <PromoRibbon analyticsContext={analyticsContext} />
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-1/2 focus-visible:top-sm focus-visible:-translate-x-1/2 focus-visible:inline-flex focus-visible:items-center focus-visible:rounded-pill focus-visible:border focus-visible:border-border focus-visible:bg-bg focus-visible:px-sm focus-visible:py-xs focus-visible:text-sm focus-visible:text-text focus-visible:shadow-card focus-visible:transition focus-visible:z-header focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        data-testid="lh-nav-skip-link"
      >
        {skipLinkLabel}
      </a>
      <div
        className={cn(
          'mx-auto flex w-full max-w-6xl items-center justify-between gap-sm px-gutter py-sm transition-[padding,gap] duration-base',
          'group-data-[header-state=shrink]/header:gap-xs',
          'group-data-[header-state=shrink]/header:py-xs',
          'group-data-[motion=disabled]/header:transition-none'
        )}
      >
        <div className="flex items-center gap-sm transition-[gap] duration-base group-data-[header-state=shrink]/header:gap-xs group-data-[motion=disabled]/header:transition-none">
          <Link
            href={homeHref}
            prefetch={false}
            className="text-base font-semibold tracking-tight text-text transition-transform duration-base group-data-[header-state=shrink]/header:scale-95 group-data-[motion=disabled]/header:scale-100 group-data-[motion=disabled]/header:transition-none"
            onClick={() => {
              recordHeaderEvent(
                'header_brand_click',
                analyticsContext,
                { target: brandTarget, trigger: 'brand' },
                { surface: 'header' }
              );
            }}
          >
            {t('logo')}
          </Link>
        </div>

        <nav
          className={cn(
            'hidden flex-1 items-center justify-center gap-lg transition-[gap] duration-base lg:flex',
            'group-data-[header-state=shrink]/header:gap-md',
            'group-data-[motion=disabled]/header:transition-none'
          )}
          role="navigation"
          aria-label={t('nav.primaryLabel')}
          data-testid="lh-nav-primary"
        >
          {primaryNavItems.map(({ item, label }) => (
            <HeaderNavLink
              key={item.id}
              item={item}
              label={label}
              analyticsContext={analyticsContext}
              surface="header"
            />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-sm transition-[gap] duration-base group-data-[header-state=shrink]/header:gap-xs group-data-[motion=disabled]/header:transition-none">
          {hasLocaleSwitcher ? (
            <HeaderLocaleSwitcher
              variant="desktop"
              analyticsContext={analyticsContext}
              surface="header"
            />
          ) : null}
          {hasThemeToggle ? (
            <HeaderThemeToggle
              variant="desktop"
              analyticsContext={analyticsContext}
              surface="header"
            />
          ) : null}
          {hasConsentButton ? (
            <HeaderConsentButton
              variant="desktop"
              analyticsContext={analyticsContext}
              surface="header"
            />
          ) : null}
          <HeaderCtaButton
            variant="desktop"
            config={ctaConfig}
            label={ctaLabel}
            onScrollTarget={handleScrollToForm}
            analyticsContext={analyticsContext}
          />
          {showAuthLinks ? (
            <HeaderLogoutLink
              variant="desktop"
              href={logoutHref}
              label={logoutLabel}
              analyticsContext={analyticsContext}
            />
          ) : null}
          <button
            type="button"
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-sm font-medium text-text lg:hidden',
              focusRing
            )}
            aria-expanded={drawerOpen}
            aria-controls={DRAWER_ID}
            aria-haspopup="dialog"
            onClick={() => (drawerOpen ? closeDrawer('button') : handleDrawerOpen('button'))}
            ref={triggerRef}
            data-nav-drawer-trigger
            data-surface="drawer-trigger"
            data-ll="nav-menu-button"
            data-testid="lh-nav-menu-toggle"
          >
            {menuButtonLabel}
          </button>
        </div>
      </div>

      {secondaryNavItems.length > 0 ? (
        <nav
          className="hidden border-t border-border/60 bg-bg px-gutter py-xs lg:block"
          role="navigation"
          aria-label={t('nav.secondaryLabel')}
          data-testid="lh-nav-secondary"
        >
          <ul className="mx-auto flex max-w-6xl items-center gap-md text-xs text-text-muted">
            {secondaryNavItems.map(({ item, label }) => (
              <li key={item.id}>
                <HeaderNavLink
                  item={item}
                  label={label}
                  subtle
                  analyticsContext={analyticsContext}
                  surface="header"
                />
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <HeaderDrawer
        open={drawerOpen}
        onClose={(reason) => closeDrawer(reason)}
        onNavigate={(item) => {
          void item;
          closeDrawer('nav', { restoreFocus: false });
        }}
        primary={primaryNavItems}
        secondary={secondaryNavItems}
        analyticsContext={analyticsContext}
        localeControl={
          hasLocaleSwitcher || hasThemeToggle || hasConsentButton ? (
            <div className="flex flex-col gap-sm" data-drawer-system>
              {hasLocaleSwitcher ? (
                <HeaderLocaleSwitcher
                  variant="mobile"
                  analyticsContext={analyticsContext}
                  surface="drawer"
                  onLocaleChange={() => closeDrawer('system', { restoreFocus: false })}
                />
              ) : null}
              {hasThemeToggle ? (
                <HeaderThemeToggle
                  variant="mobile"
                  analyticsContext={analyticsContext}
                  surface="drawer"
                  onThemeChange={() => closeDrawer('system', { restoreFocus: false })}
                />
              ) : null}
              {hasConsentButton ? (
                <HeaderConsentButton
                  variant="mobile"
                  analyticsContext={analyticsContext}
                  surface="drawer"
                  onOpen={() => closeDrawer('system', { restoreFocus: false })}
                />
              ) : null}
            </div>
          ) : null
        }
        navLabel={drawerNavLabel}
        title={drawerTitle}
        closeLabel={drawerCloseLabel}
        drawerId={DRAWER_ID}
        cta={
          <div className="flex flex-col gap-sm">
            <HeaderCtaButton
              variant="mobile"
              config={ctaConfig}
              label={ctaLabel}
              onScrollTarget={() => {
                closeDrawer('cta', { restoreFocus: false });
                handleScrollToForm();
              }}
              analyticsContext={analyticsContext}
              surface="drawer"
            />
            {showAuthLinks ? (
              <HeaderLogoutLink
                variant="drawer"
                href={logoutHref}
                label={logoutLabel}
                analyticsContext={analyticsContext}
                surface="drawer"
                onNavigate={() => closeDrawer('cta', { restoreFocus: false })}
              />
            ) : null}
          </div>
        }
      />

      <div className="flex flex-col gap-sm px-gutter pb-sm transition-[padding] duration-base group-data-[header-state=shrink]/header:pb-xs group-data-[motion=disabled]/header:transition-none lg:hidden">
        <HeaderCtaButton
          variant="mobile"
          config={ctaConfig}
          label={ctaLabel}
          onScrollTarget={handleScrollToForm}
          analyticsContext={analyticsContext}
        />
        {showAuthLinks ? (
          <HeaderLogoutLink
            variant="mobile"
            href={logoutHref}
            label={logoutLabel}
            analyticsContext={analyticsContext}
          />
        ) : null}
      </div>
    </header>
  );
}

type HeaderNavLinkProps = {
  item: NavItemResolved;
  label: string;
  subtle?: boolean;
  analyticsContext: HeaderEventContext;
  surface: HeaderSurface;
};

function HeaderNavLink({ item, label, subtle, analyticsContext, surface }: HeaderNavLinkProps) {
  const baseClass = cn(
    'inline-flex h-11 items-center rounded-pill px-md text-sm font-medium transition-colors duration-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
    subtle ? 'text-text-muted hover:text-text' : 'text-text hover:text-text'
  );
  const dataAttributes = {
    'data-nav-id': item.id,
    'data-analytics-event': item.analyticsEvent ?? undefined,
    'data-testid': `lh-nav-item-${item.id}`,
  } as const;
  const isAnchor = item.href.startsWith('#');
  const enableIntentPrefetch = !item.isExternal && !isAnchor;
  const prefetchHandlers = useIntentPrefetch(enableIntentPrefetch ? item.href : null, {
    enabled: enableIntentPrefetch,
  });
  const prefetchPolicyAttributes = enableIntentPrefetch
    ? ({ 'data-prefetch-policy': 'intent' } as const)
    : {};
  const analyticsTarget = useMemo(() => getNavAnalyticsTarget(item) ?? item.href, [item]);

  const emitNavEvent = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    const trigger = resolveInteractionTrigger(event);
    recordHeaderEvent(
      'header_nav_click',
      analyticsContext,
      {
        navId: item.id,
        target: analyticsTarget,
        trigger,
      },
      { surface }
    );
  };

  if (item.isExternal) {
    return (
      <a
        key={item.id}
        href={item.href}
        rel={item.rel ?? 'noopener noreferrer'}
        target={item.target ?? '_blank'}
        className={baseClass}
        {...dataAttributes}
        onClick={(event) => {
          emitNavEvent(event);
        }}
      >
        {label}
      </a>
    );
  }

  if (isAnchor) {
    return (
      <a
        key={item.id}
        href={item.href}
        className={baseClass}
        {...dataAttributes}
        onClick={(event) => {
          emitNavEvent(event);
        }}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      key={item.id}
      href={item.href}
      prefetch={item.prefetch ?? false}
      className={baseClass}
      {...dataAttributes}
      {...prefetchPolicyAttributes}
      {...prefetchHandlers}
      onClick={(event) => {
        emitNavEvent(event);
      }}
    >
      {label}
    </Link>
  );
}

type HeaderCtaButtonProps = {
  variant: 'desktop' | 'mobile';
  config: HeaderCtaConfig;
  label: string;
  onScrollTarget: () => void;
  analyticsContext: HeaderEventContext;
  surface?: 'header' | 'drawer';
};

function HeaderCtaButton({ variant, config, label, onScrollTarget, analyticsContext, surface = 'header' }: HeaderCtaButtonProps) {
  const buttonClasses = variant === 'desktop'
    ? cn(buttons.primary, 'hidden h-11 min-w-[12rem] justify-center gap-sm lg:inline-flex')
    : cn(buttons.primary, 'h-11 w-full justify-center');

  const dataAttrs: Record<string, string | undefined> = {
    'data-testid': variant === 'desktop' ? 'lh-nav-cta-primary' : 'lh-nav-cta-primary-mobile',
    'data-cta-mode': config.id,
    'data-ll': variant === 'desktop' ? 'nav-waitlist-cta' : undefined,
  };

  const linkAction = config.action.type === 'link' ? config.action : null;
  const isInternalLink = Boolean(linkAction && !linkAction.external);
  const intentPrefetchHandlers = useIntentPrefetch(linkAction?.href ?? null, {
    enabled: isInternalLink,
  });
  const prefetchPolicyAttributes = isInternalLink
    ? ({ 'data-prefetch-policy': 'intent' } as const)
    : {};

  const emitCtaEvent = (event?: ReactMouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    const trigger = resolveInteractionTrigger(event);
    recordHeaderEvent(
      'header_cta_click',
      analyticsContext,
      {
        ctaId: config.id,
        target: config.analyticsTarget,
        trigger,
      },
      { surface }
    );
  };

  if (config.action.type === 'scroll') {
    return (
      <button
        type="button"
        className={buttonClasses}
        onClick={(event) => {
          emitCtaEvent(event);
          onScrollTarget();
        }}
        {...dataAttrs}
      >
        {label}
      </button>
    );
  }

  const href = config.action.href;
  if (config.action.external) {
    return (
      <a
        className={buttonClasses}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          emitCtaEvent(event);
        }}
        {...dataAttrs}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      className={buttonClasses}
      href={href}
      prefetch={false}
      onClick={(event) => {
        emitCtaEvent(event);
      }}
      {...dataAttrs}
      {...prefetchPolicyAttributes}
      {...intentPrefetchHandlers}
    >
      {label}
    </Link>
  );
}

type HeaderLogoutLinkProps = {
  variant: 'desktop' | 'mobile' | 'drawer';
  href: string;
  label: string;
  analyticsContext: HeaderEventContext;
  surface?: HeaderSurface;
  onNavigate?: () => void;
};

function HeaderLogoutLink({ variant, href, label, analyticsContext, surface, onNavigate }: HeaderLogoutLinkProps) {
  const surfaceValue: HeaderSurface = surface ?? (variant === 'drawer' ? 'drawer' : 'header');
  const analyticsTarget = useMemo(() => resolveAnalyticsTarget(href), [href]);

  const baseClass = cn(buttons.secondary, 'h-11 justify-center gap-sm');
  const variantClass = variant === 'desktop'
    ? 'hidden min-w-[10rem] lg:inline-flex'
    : 'w-full';

  const testId = variant === 'desktop'
    ? 'lh-nav-logout-desktop'
    : variant === 'drawer'
      ? 'lh-nav-logout-drawer'
      : 'lh-nav-logout-mobile';

  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    const trigger = resolveInteractionTrigger(event);
    recordHeaderEvent(
      'header_cta_click',
      analyticsContext,
      {
        ctaId: 'logout',
        target: analyticsTarget,
        trigger,
      },
      { surface: surfaceValue }
    );
    onNavigate?.();
  };

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(baseClass, variantClass)}
      onClick={handleClick}
      data-testid={testId}
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
