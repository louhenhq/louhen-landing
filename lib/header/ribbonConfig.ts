import { appendUtmParams, type UtmParams } from '@/lib/url/appendUtmParams';
import { resolveAnalyticsTarget } from '@/lib/url/analyticsTarget';
import { defaultLocale, type SupportedLocale } from '@/next-intl.locales';

declare global {
  interface Window {
    __LOUHEN_PROMO_RIBBON__?: PromoRibbonOverride | null;
  }
}

type PromoRibbonOverride = {
  id: string;
  href?: string;
  utm?: UtmParams;
  target?: string;
};

export type PromoRibbonConfig = {
  id: string;
  i18nKey: string;
  href?: string;
  analyticsTarget?: string;
  utm?: UtmParams;
};

const RIBBON_ENABLED = process.env.NEXT_PUBLIC_PROMO_RIBBON_ENABLED === '1';
const RIBBON_ID = process.env.NEXT_PUBLIC_PROMO_RIBBON_ID?.trim();
const RIBBON_HREF = process.env.NEXT_PUBLIC_PROMO_RIBBON_LINK?.trim();

function resolveOverride(): PromoRibbonOverride | null {
  if (typeof window === 'undefined') return null;
  return window.__LOUHEN_PROMO_RIBBON__ ?? null;
}

export function resolvePromoRibbon(locale: SupportedLocale): PromoRibbonConfig | null {
  const override = resolveOverride();
  if (override) {
    const analyticsTarget = override.target ?? (override.href ? resolveAnalyticsTarget(override.href) : undefined);
    const href = override.href
      ? appendUtmParams(override.href, {
          source: 'header',
          medium: 'promo-ribbon',
          ...(override.utm ?? {}),
        })
      : undefined;
    return {
      id: override.id,
      i18nKey: `header.ribbon.${override.id}`,
      ...(href ? { href } : {}),
      ...(analyticsTarget ? { analyticsTarget } : {}),
      ...(override.utm ? { utm: override.utm } : {}),
    };
  }

  if (!RIBBON_ENABLED || !RIBBON_ID) return null;

  const campaignKey = locale === defaultLocale ? RIBBON_ID : `${RIBBON_ID}-${locale}`;
  const analyticsTarget = RIBBON_HREF ? resolveAnalyticsTarget(RIBBON_HREF) : undefined;
  const href = RIBBON_HREF
    ? appendUtmParams(RIBBON_HREF, {
        source: 'header',
        medium: 'promo-ribbon',
        campaign: campaignKey,
      })
    : undefined;

  return {
    id: RIBBON_ID,
    i18nKey: `header.ribbon.${RIBBON_ID}`,
    ...(href ? { href } : {}),
    ...(analyticsTarget ? { analyticsTarget } : {}),
  };
}
