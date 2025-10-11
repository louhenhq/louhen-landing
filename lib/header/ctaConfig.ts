import { appendUtmParams, type UtmParams } from '@/lib/url/appendUtmParams';
import { resolveAnalyticsTarget } from '@/lib/url/analyticsTarget';
import type { HeaderAnalyticsMode, HeaderCtaId } from '@/lib/analytics.schema';
import { resolveDashboardUrl, type HeaderUserState } from '@/lib/auth/userState';
import { isPrelaunch } from '@/lib/env/prelaunch';
import { defaultLocale, type SupportedLocale } from '@/next-intl.locales';

declare global {
  interface Window {
    __LOUHEN_HEADER_PHASE__?: HeaderPhase;
  }
}

type HeaderPhase = 'waitlist' | 'access' | 'download';

type ScrollAction = {
  type: 'scroll';
  targetId: string;
};

type LinkAction = {
  type: 'link';
  href: string;
  external?: boolean;
  utm?: UtmParams;
};

type HeaderCtaConfig = {
  id: HeaderCtaId;
  mode: HeaderAnalyticsMode;
  labelKey: string;
  descriptionKey?: string;
  analyticsTarget: string;
  action: ScrollAction | LinkAction;
};

const DEFAULT_WAITLIST_TARGET = 'waitlist-form';
const ACCESS_URL = process.env.NEXT_PUBLIC_ACCESS_REQUEST_URL?.trim() || '/onboarding/request-access';
const DOWNLOAD_URL = process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL?.trim() || '/download';

function phaseToMode(phase: HeaderPhase): HeaderAnalyticsMode {
  switch (phase) {
    case 'waitlist':
      return 'prelaunch';
    case 'access':
      return 'launch';
    case 'download':
    default:
      return 'postlaunch';
  }
}

function resolvePhaseOverride(): HeaderPhase | null {
  if (typeof window !== 'undefined' && window.__LOUHEN_HEADER_PHASE__) {
    return window.__LOUHEN_HEADER_PHASE__;
  }
  const env = process.env.NEXT_PUBLIC_HEADER_PHASE?.trim().toLowerCase();
  if (!env) return null;
  if (env === 'waitlist' || env === 'waitlist-phase') return 'waitlist';
  if (env === 'closed-beta' || env === 'beta' || env === 'access') return 'access';
  if (env === 'post-launch' || env === 'download') return 'download';
  return null;
}

export function resolveHeaderPhase(): HeaderPhase {
  const override = resolvePhaseOverride();
  if (override) return override;
  if (isPrelaunch()) return 'waitlist';
  if (process.env.NEXT_PUBLIC_ACCESS_REQUEST_URL?.trim()) return 'access';
  return 'download';
}

function resolveDashboardConfig(): HeaderCtaConfig {
  const href = resolveDashboardUrl();
  const analyticsTarget = resolveAnalyticsTarget(href);
  const external = /^https?:\/\//.test(href);
  return {
    id: 'dashboard',
    mode: 'authenticated',
    labelKey: 'cta.dashboard',
    analyticsTarget,
    action: {
      type: 'link',
      href,
      external,
    },
  };
}

export function buildHeaderCta(locale: SupportedLocale, options?: { userState?: HeaderUserState }): HeaderCtaConfig {
  if (options?.userState === 'hinted') {
    return resolveDashboardConfig();
  }

  const phase = resolveHeaderPhase();
  const mode = phaseToMode(phase);

  if (phase === 'waitlist') {
    return {
      id: 'waitlist',
      mode,
      labelKey: 'cta.waitlist',
      analyticsTarget: `#${DEFAULT_WAITLIST_TARGET}`,
      action: {
        type: 'scroll',
        targetId: DEFAULT_WAITLIST_TARGET,
      },
    };
  }

  if (phase === 'access') {
    const analyticsTarget = resolveAnalyticsTarget(ACCESS_URL);
    const href = appendUtmParams(ACCESS_URL, {
      source: 'header',
      medium: 'cta',
      campaign: locale === defaultLocale ? 'access-en' : `access-${locale}`,
    });
    return {
      id: 'access',
      mode,
      labelKey: 'cta.access',
      analyticsTarget,
      action: {
        type: 'link',
        href,
      },
    };
  }

  const analyticsTarget = resolveAnalyticsTarget(DOWNLOAD_URL);
  const href = appendUtmParams(DOWNLOAD_URL, {
    source: 'header',
    medium: 'cta',
    campaign: locale === defaultLocale ? 'download-en' : `download-${locale}`,
  });

  return {
    id: 'download',
    mode,
    labelKey: 'cta.download',
    analyticsTarget,
    action: {
      type: 'link',
      href,
      external: /^https?:\/\//.test(DOWNLOAD_URL),
    },
  };
}

export type { HeaderCtaConfig, HeaderPhase, ScrollAction, LinkAction };
export const resolveHeaderMode = (userState: HeaderUserState = 'guest'): HeaderAnalyticsMode => {
  if (userState === 'hinted') {
    return 'authenticated';
  }
  return phaseToMode(resolveHeaderPhase());
};
export type { HeaderAnalyticsMode };
