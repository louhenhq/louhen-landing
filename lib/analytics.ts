import { getConsent } from '@/app/(site)/_lib/consent';

export type AnalyticsEvent =
  | { name: 'page_view'; path: string; variant?: string; ref?: string | null }
  | { name: 'cta_click'; id: 'hero_primary' | 'hero_secondary'; variant?: string }
  | { name: 'waitlist_submit'; ok: boolean; error?: string }
  | { name: 'how_it_works_click' }
  | { name: 'wl_view'; locale?: string; path?: string; ref?: string | null }
  | { name: 'wl_submit'; status: 'ok' | 'error'; code?: string; selfReferralSuspect?: boolean }
  | { name: 'wl_confirm_success'; token_status: 'valid' }
  | { name: 'wl_confirm_expired'; token_status: 'expired' }
  | { name: 'wl_resend'; status: 'ok' | 'error' }
  | { name: 'wl_share_view' }
  | { name: 'wl_share_copy_link'; method: string }
  | { name: 'wl_share_copy_code'; method: string }
  | { name: 'wl_share_native'; supported: boolean }
  | { name: 'wl_referral_applied'; ref: string };

export async function track(evt: AnalyticsEvent) {
  if (typeof window === 'undefined') return;
  const consent = getConsent();
  if (!consent?.analytics) return;
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...evt,
        ts: Date.now(),
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      }),
      keepalive: true,
    });
  } catch {
    // swallow
  }
}
