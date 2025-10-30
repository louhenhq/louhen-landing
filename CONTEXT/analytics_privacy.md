# Analytics & Privacy — Header

Defines how header interactions are tracked while honouring GDPR requirements. Pairs with `components/ConsentProvider` and `lib/clientAnalytics.ts`.

---

> Global consent + analytics policy lives in [/CONTEXT/privacy_analytics.md](privacy_analytics.md). This page documents header-specific event contracts until the new bootstrap lands.

## Consent Gating
- Header must read consent via `useConsent()` (preferred) or `track()` which already checks the shared consent store (`ll_consent` cookie). Do not bypass consent when emitting events.
- Until analytics consent is granted, queue events locally; flush automatically once the user accepts. Never send partial payloads without consent.
- Consent badge reflects current state. Clicking it opens the manager rather than toggling analytics directly (for audit purposes).
- Cookie contract: `ll_consent` stores `v1:<state>` (`state` ∈ `granted` | `denied`), `SameSite=Lax`, `Secure` in production, 12-month max-age. Clearing consent removes the cookie and dispatches `louhen:consent` with `analytics=false` so gates reset immediately.
- Client helpers (`lib/clientAnalytics.ts`) handle consent gating and queueing automatically (with `canTrack()` still available for manual guards); when consent flips to denied, pending queues are cleared and the dedupe cache is reset.

---

## Event Catalogue
- `header_brand_click`
- `header_nav_click`
- `header_cta_click`
- `header_locale_switch`
- `header_theme_toggle`
- `header_consent_open`
- `header_open_drawer`, `header_close_drawer`
- `header_ribbon_view`, `header_ribbon_click`, `header_ribbon_dismiss`

Payload contract (all optional fields omitted when undefined):
```ts
type HeaderEvent = {
  name: string;
  locale: SupportedLocale;
  mode: 'prelaunch' | 'launch' | 'postlaunch' | 'authenticated';
  surface: 'header' | 'drawer' | 'ribbon';
  user_state: 'guest' | 'hinted';
  target?: string; // e.g., '#waitlist-form', '/de-de/method', 'app-store'
  trigger?: 'click' | 'keyboard' | 'touch' | 'pointer' | 'brand' | 'change' | 'auto' | 'button' | 'escape' | 'backdrop' | 'nav' | 'cta' | 'system';
  ctaId?: 'waitlist' | 'access' | 'download';
  navId?: 'how-it-works' | 'founder-story' | 'faq' | 'method' | 'privacy' | 'terms';
  ribbonId?: string;
  from?: SupportedLocale | 'system' | 'light' | 'dark';
  to?: SupportedLocale | 'system' | 'light' | 'dark';
  state?: 'granted' | 'denied' | 'unset';
};
```

`recordHeaderEvent` enriches payloads with locale/mode/surface and the derived `user_state` hint automatically, and normalises `target` values through `lib/url/analyticsTarget.ts` (relative paths or `app-store`/`google-play` for external stores). The helper always enqueues via the shared analytics queue: prior to consent grant, events remain client-side with no network activity; once consent flips to granted, the queue flushes FIFO. Drawer open/close events set `surface: 'drawer'` and include their trigger (`'button'`, `'escape'`, `'nav'`, etc.).

Include UTM snapshot (from `track()` helper) automatically; do not manually append UTMs to URLs for internal navigation.

---

## Data Minimisation
- Do not log email, name, or other personal attributes from header interactions. The `LH_AUTH` hint cookie is boolean-only (`'guest' | 'hinted'`) and is surfaced to analytics as `user_state` without any identifiers.
- Locale switcher events capture only locale codes (e.g., `en-de`). No geolocation inference.
- Theme toggle stores preference in `localStorage` and does not sync to server.
- Ribbon dismissals store a hashed `promoId` in `localStorage` with 30-day TTL so we honour user choice without server state.

---

## Storage & Cookies
- Locale preference lives in `NEXT_LOCALE` cookie managed by `next-intl`. Consent cookie remains `ll_consent`; header must not overwrite it.
- No new cookies may be introduced by the header without DPO approval. Document any additions here and in `CONTEXT/legal.md`.

---

## Monitoring
- Integrate header coverage into existing analytics dashboards by tagging events with `surface: 'header'`.
- Add synthetic Playwright test that waits for consent accept, clicks the CTA, and asserts that `/api/track` receives the expected payload (mock endpoint in tests).
- If analytics transport is disabled (`NEXT_PUBLIC_ANALYTICS_DISABLED=1`), header must silently no-op without errors in console.
- QA expectations:
  - Pre-consent: header CTAs must not trigger `/api/track` or third-party requests.
  - Accept → `/api/track` called once, `window.__LOUHEN_ANALYTICS_READY=true`.
  - Reject → `/api/track` suppressed, readiness flag false, and any queued payloads flushed without transmission.

Keep this doc updated as new header interactions or consent flows launch.
