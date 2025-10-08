import type { HeaderUserState } from '@/lib/auth/userState';
import type { SupportedLocale } from '@/next-intl.locales';

export type SectionViewId = 'founder-story' | 'how';
export type TestimonialIndex = 0 | 1 | 2;

type NoProps = Record<never, never>;

export type HeaderAnalyticsMode = 'prelaunch' | 'launch' | 'postlaunch' | 'authenticated';

export type AnalyticsEventName =
  | 'page_view'
  | 'cta_click'
  | 'waitlist_submit'
  | 'how_it_works_click'
  | 'wl_view'
  | 'wl_submit'
  | 'wl_confirm_success'
  | 'wl_confirm_expired'
  | 'wl_resend'
  | 'wl_share_view'
  | 'wl_share_copy_link'
  | 'wl_share_copy_code'
  | 'wl_share_native'
  | 'wl_referral_applied'
  | 'waitlist_signup_submitted'
  | 'waitlist_signup_result'
  | 'waitlist_signup_confirmed'
  | 'waitlist_signup_expired'
  | 'waitlist_landing_success_view'
  | 'waitlist_landing_expired_view'
  | 'waitlist_resend_requested'
  | 'waitlist_confirm_toast_view'
  | 'preonboarding_completed'
  | 'hero_twin_badge_click'
  | 'voucher_share_native_success'
  | 'voucher_share_whatsapp_click'
  | 'section_view'
  | 'voucher_code_copy'
  | 'trust_logo_click'
  | 'trust_podiatrist_learn_more'
  | 'testimonial_view'
  | 'privacy_ribbon_click'
  | 'header_brand_click'
  | 'header_nav_click'
  | 'header_cta_click'
  | 'header_locale_switch'
  | 'header_theme_toggle'
  | 'header_consent_open'
  | 'header_open_drawer'
  | 'header_close_drawer'
  | 'header_ribbon_view'
  | 'header_ribbon_click'
  | 'header_ribbon_dismiss';

export type HeaderSurface = 'header' | 'drawer' | 'ribbon';
export type HeaderDrawerTrigger = 'button' | 'escape' | 'backdrop' | 'nav' | 'cta' | 'system';
export type HeaderEventTrigger =
  | 'click'
  | 'keyboard'
  | 'touch'
  | 'pointer'
  | 'brand'
  | 'auto'
  | 'change'
  | HeaderDrawerTrigger;

export type HeaderNavId = 'how-it-works' | 'founder-story' | 'faq' | 'method' | 'privacy' | 'terms';
export type HeaderCtaId = 'waitlist' | 'access' | 'download' | 'dashboard' | 'logout';
export type HeaderThemePreference = 'system' | 'light' | 'dark';
export type HeaderConsentState = 'granted' | 'denied' | 'unset';

export interface AnalyticsEventPropsMap {
  header_brand_click: HeaderBrandEventProps;
  header_nav_click: HeaderNavEventProps;
  header_cta_click: HeaderCtaEventProps;
  header_locale_switch: HeaderLocaleSwitchEventProps;
  header_theme_toggle: HeaderThemeToggleEventProps;
  header_consent_open: HeaderConsentOpenEventProps;
  header_open_drawer: HeaderDrawerEventProps;
  header_close_drawer: HeaderDrawerEventProps;
  header_ribbon_view: HeaderRibbonEventProps;
  header_ribbon_click: HeaderRibbonEventProps;
  header_ribbon_dismiss: HeaderRibbonEventProps;
  page_view: { path?: string; page?: string; variant?: string; ref?: string | null };
  cta_click: { id: 'hero_primary' | 'hero_secondary'; variant?: string } | { page: string; cta: string };
  waitlist_submit: { ok: boolean; error?: string };
  how_it_works_click: NoProps;
  wl_view: { locale?: string; path?: string; ref?: string | null };
  wl_submit: { status: 'ok' | 'error'; code?: string; selfReferralSuspect?: boolean };
  wl_confirm_success: { token_status: 'valid' };
  wl_confirm_expired: { token_status: 'expired' };
  wl_resend: { status: 'ok' | 'error' };
  wl_share_view: NoProps;
  wl_share_copy_link: { method: string };
  wl_share_copy_code: { method: string };
  wl_share_native: { supported: boolean };
  wl_referral_applied: { ref: string };
  waitlist_signup_submitted: { locale: string; hasUtm: boolean; hasRef: boolean };
  waitlist_signup_result: { ok: boolean; code?: string | null; source?: string | null; locale?: string | null; status?: number | null };
  waitlist_signup_confirmed: { locale: string; timeToConfirmMs?: number | null };
  waitlist_signup_expired: { locale: string; ttlDays?: number | null };
  waitlist_landing_success_view: NoProps;
  waitlist_landing_expired_view: NoProps;
  waitlist_resend_requested: { locale: string; outcome?: 'ok' | 'rate_limited' | 'error' };
  waitlist_confirm_toast_view: NoProps;
  preonboarding_completed: { hadChildData: boolean; locale: string };
  hero_twin_badge_click: NoProps;
  voucher_share_native_success: NoProps;
  voucher_share_whatsapp_click: NoProps;
  section_view: { id: SectionViewId };
  voucher_code_copy: { code: 'TWINS5' };
  trust_logo_click: { label: string };
  trust_podiatrist_learn_more: NoProps;
  testimonial_view: { ix: TestimonialIndex };
  privacy_ribbon_click: NoProps;
  method_hero_waitlist_click: MethodAnalyticsPayload<'hero'>;
  method_faq_teaser_waitlist_click: MethodAnalyticsPayload<'faq_teaser'>;
  method_sticky_waitlist_click: MethodAnalyticsPayload<'sticky'>;
  method_exit_nudge_shown: MethodAnalyticsPayload<'nudge'>;
}

type HeaderEventBase<S extends HeaderSurface = 'header'> = {
  locale: SupportedLocale;
  mode: HeaderAnalyticsMode;
  surface: S;
  'user_state': HeaderUserState;
};

type HeaderCtaEventProps = HeaderEventBase<'header' | 'drawer'> & {
  ctaId: HeaderCtaId;
  target?: string;
  trigger?: HeaderEventTrigger;
};

type HeaderNavEventProps = HeaderEventBase<'header' | 'drawer'> & {
  navId: HeaderNavId;
  target?: string;
  trigger?: HeaderEventTrigger;
};

type HeaderBrandEventProps = HeaderEventBase<'header'> & {
  target?: string;
  trigger?: HeaderEventTrigger;
};

type HeaderLocaleSwitchEventProps = HeaderEventBase<'header' | 'drawer'> & {
  from: SupportedLocale;
  to: SupportedLocale;
  target?: string;
  trigger?: HeaderEventTrigger;
};

type HeaderThemeToggleEventProps = HeaderEventBase<'header' | 'drawer'> & {
  from: HeaderThemePreference;
  to: HeaderThemePreference;
  trigger?: HeaderEventTrigger;
};

type HeaderConsentOpenEventProps = HeaderEventBase<'header' | 'drawer'> & {
  state: HeaderConsentState;
  trigger?: HeaderEventTrigger;
};

type HeaderRibbonEventProps = HeaderEventBase<'ribbon'> & {
  ribbonId: string;
  target?: string;
  trigger?: HeaderEventTrigger;
};

type HeaderDrawerEventProps = HeaderEventBase<'drawer'> & {
  trigger?: HeaderDrawerTrigger;
};

export type AnalyticsEventPayload<E extends AnalyticsEventName = AnalyticsEventName> = {
  name: E;
} & AnalyticsEventPropsMap[E];

export type IdentifyProps = Record<string, unknown>;
