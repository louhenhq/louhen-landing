export type SectionViewId = 'founder-story' | 'how';
export type TestimonialIndex = 0 | 1 | 2;

type NoProps = Record<never, never>;

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
  | 'hero_twin_badge_click'
  | 'voucher_share_native_success'
  | 'voucher_share_whatsapp_click'
  | 'section_view'
  | 'voucher_code_copy'
  | 'trust_logo_click'
  | 'trust_podiatrist_learn_more'
  | 'testimonial_view'
  | 'privacy_ribbon_click';

export interface AnalyticsEventPropsMap {
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
  hero_twin_badge_click: NoProps;
  voucher_share_native_success: NoProps;
  voucher_share_whatsapp_click: NoProps;
  section_view: { id: SectionViewId };
  voucher_code_copy: { code: 'TWINS5' };
  trust_logo_click: { label: string };
  trust_podiatrist_learn_more: NoProps;
  testimonial_view: { ix: TestimonialIndex };
  privacy_ribbon_click: NoProps;
}

export type AnalyticsEventPayload<E extends AnalyticsEventName = AnalyticsEventName> = {
  name: E;
} & AnalyticsEventPropsMap[E];

export type IdentifyProps = Record<string, unknown>;
