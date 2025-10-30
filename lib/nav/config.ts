import { legalPath, localeHomePath, type LegalSlug } from '@lib/shared/routing/legal-path';
import { methodPath } from '@lib/shared/routing/method-path';
import { appendUtmParams, type UtmParams } from '@lib/url/appendUtmParams';
import { defaultLocale, type SupportedLocale } from '@/next-intl.locales';

type AnalyticsEventName = 'header_nav_click';

export type NavUtmParams = UtmParams;

export type AnchorTarget = {
  kind: 'anchor';
  value: `#${string}`;
};

export type InternalDestination =
  | { type: 'home' }
  | { type: 'method' }
  | { type: 'preferences' }
  | { type: 'onboarding-account' }
  | { type: 'legal'; slug: LegalSlug };

export type InternalTarget = {
  kind: 'internal';
  destination: InternalDestination;
  prefetch?: boolean;
};

export type ExternalTarget = {
  kind: 'external';
  url: string;
  utm?: NavUtmParams;
  rel?: string;
  target?: '_blank' | '_self' | '_parent' | '_top' | string;
};

export type NavTarget = AnchorTarget | InternalTarget | ExternalTarget;

export type NavItemId =
  | 'how-it-works'
  | 'founder-story'
  | 'faq'
  | 'method'
  | 'privacy'
  | 'terms';

export interface NavItemConfig {
  id: NavItemId;
  i18nKey: string;
  target: NavTarget;
  analyticsEvent?: AnalyticsEventName;
}

export interface NavItemResolved {
  id: NavItemId;
  i18nKey: string;
  href: string;
  analyticsEvent?: AnalyticsEventName;
  isExternal: boolean;
  rel?: string;
  target?: string;
  prefetch?: boolean;
}

export type SystemControlId = 'locale' | 'theme' | 'consent';

export interface SystemControlConfig {
  id: SystemControlId;
  type: 'locale-switcher' | 'theme-toggle' | 'consent-manager';
  i18nKey: string;
  status: 'available' | 'planned';
}

export interface HeaderNavigationDefinition {
  primary: NavItemConfig[];
  secondary: NavItemConfig[];
  system: SystemControlConfig[];
}

export interface HeaderNavigation {
  primary: NavItemResolved[];
  secondary: NavItemResolved[];
  system: SystemControlConfig[];
}

const NAV_DEFINITION: HeaderNavigationDefinition = {
  primary: [
    {
      id: 'how-it-works',
      i18nKey: 'nav.primary.how',
      target: { kind: 'anchor', value: '#how' },
      analyticsEvent: 'header_nav_click',
    },
    {
      id: 'founder-story',
      i18nKey: 'nav.primary.story',
      target: { kind: 'anchor', value: '#story' },
      analyticsEvent: 'header_nav_click',
    },
    {
      id: 'faq',
      i18nKey: 'nav.primary.faq',
      target: { kind: 'anchor', value: '#faq' },
      analyticsEvent: 'header_nav_click',
    },
    {
      id: 'method',
      i18nKey: 'nav.primary.method',
      target: { kind: 'internal', destination: { type: 'method' }, prefetch: false },
      analyticsEvent: 'header_nav_click',
    },
  ],
  secondary: [
    {
      id: 'privacy',
      i18nKey: 'nav.secondary.privacy',
      target: { kind: 'internal', destination: { type: 'legal', slug: 'privacy' }, prefetch: false },
      analyticsEvent: 'header_nav_click',
    },
    {
      id: 'terms',
      i18nKey: 'nav.secondary.terms',
      target: { kind: 'internal', destination: { type: 'legal', slug: 'terms' }, prefetch: false },
      analyticsEvent: 'header_nav_click',
    },
  ],
  system: [
    {
      id: 'locale',
      type: 'locale-switcher',
      i18nKey: 'header.locale.label',
      status: 'available',
    },
    {
      id: 'theme',
      type: 'theme-toggle',
      i18nKey: 'header.system.theme',
      status: 'available',
    },
    {
      id: 'consent',
      type: 'consent-manager',
      i18nKey: 'header.system.consent',
      status: 'available',
    },
  ],
};

export function buildHeaderNavigation(locale: SupportedLocale): HeaderNavigation {
  return {
    primary: NAV_DEFINITION.primary.map((item) => resolveNavItem(item, locale)),
    secondary: NAV_DEFINITION.secondary.map((item) => resolveNavItem(item, locale)),
    system: NAV_DEFINITION.system,
  };
}

export function getSystemControls(): SystemControlConfig[] {
  return NAV_DEFINITION.system;
}

function resolveNavItem(item: NavItemConfig, locale: SupportedLocale): NavItemResolved {
  const { href, isExternal, rel, target } = resolveTarget(item.target, locale);
  const prefetch = item.target.kind === 'internal' ? item.target.prefetch : undefined;
  return {
    id: item.id,
    i18nKey: item.i18nKey,
    href,
    isExternal,
    ...(item.analyticsEvent ? { analyticsEvent: item.analyticsEvent } : {}),
    ...(rel ? { rel } : {}),
    ...(target ? { target } : {}),
    ...(prefetch !== undefined ? { prefetch } : {}),
  };
}

function resolveTarget(target: NavTarget, locale: SupportedLocale) {
  if (target.kind === 'anchor') {
    return { href: target.value, isExternal: false };
  }
  if (target.kind === 'external') {
    const url = appendUtmParams(target.url, target.utm);
    const shouldOpenNewTab = target.target ? target.target === '_blank' : true;
    const rel = target.rel ?? (shouldOpenNewTab ? 'noopener noreferrer' : undefined);
    return { href: url, isExternal: true, rel, target: target.target ?? '_blank' };
  }

  const { destination } = target;
  switch (destination.type) {
    case 'home':
      return { href: localeHomePath(locale), isExternal: false };
    case 'method':
      return { href: methodPath(locale), isExternal: false };
    case 'preferences':
      return {
        href: locale === defaultLocale ? '/preferences' : `/${locale}/preferences`,
        isExternal: false,
      };
    case 'onboarding-account':
      return {
        href: locale === defaultLocale ? '/onboarding/account' : `/${locale}/onboarding/account`,
        isExternal: false,
      };
    case 'legal':
      return { href: legalPath(locale, destination.slug), isExternal: false };
    default:
      return assertNever(destination);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled nav destination: ${JSON.stringify(value)}`);
}
