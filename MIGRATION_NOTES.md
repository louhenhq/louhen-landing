# Migration Notes

## i18n additions
- `messages/en.json` and `messages/de.json` now provide landing + confirm copy under the following key prefixes:
  - `header.*`
  - `hero.*`
  - `trust.badges.*`
  - `founder.*`
  - `how.*`
  - `faq.*`
  - `waitlist.form.*`
  - `confirm.*`
  - `confirmPending.*`
  - `footer.*`
  - `common.learnMore`

## New UI surface
- Shared helpers: `app/(site)/_lib/ui.ts`
- Referral helpers: `app/(site)/_lib/referral.ts`
- Analytics-driven surfaces: `app/(site)/components/SharePanel.tsx`, `app/(site)/components/ReferralAttribution.tsx`
- Consent management: `app/(site)/_lib/consent.ts`, `app/(site)/components/ConsentProvider.tsx`, `app/(site)/components/ConsentBanner.tsx`, `app/(site)/components/ConsentDialog.tsx`
- Trust UI: `app/(site)/components/PodiatristBadge.tsx`, `app/(site)/components/TrustModals.tsx`
- Landing shell + sections:
  - `app/(site)/components/LandingExperience.tsx`
  - `components/features/header-nav/Header.tsx`
  - `app/(site)/components/Hero.tsx`
  - `app/(site)/components/WaitlistForm.tsx`
  - `app/(site)/components/HowItWorks.tsx`
  - `app/(site)/components/FounderStory.tsx`
  - `app/(site)/components/FAQ.tsx`
  - `app/(site)/components/Footer.tsx`
  - `app/(site)/components/ConfirmResendForm.tsx`
  - `app/(site)/components/ConfirmAnalytics.tsx`
- Locale-aware routes:
  - `app/(site)/[locale]/page.tsx`
  - `app/(site)/[locale]/layout.tsx`
  - `app/(site)/[locale]/confirm/page.tsx`
  - `app/(site)/[locale]/confirm-pending/page.tsx`
- Localization utilities:
  - `next-intl.locales.ts`
  - `next-intl.config.ts`
  - `next-intl.config.mjs`
  - `middleware.ts`
- Test harness additions:
  - Unit/integration specs under `tests/`
  - Playwright setup (`playwright.config.ts`, `e2e/waitlist.spec.ts`)
  - CLI scripts: `scripts/hit-ip-cap.sh`, `scripts/self-referral.sh`
- Metrics dashboard: `app/admin/_lib/metrics.ts`, `app/admin/metrics/page.tsx`

## OG validation
- For ref-specific metadata, verify `${origin}/en?ref=CODE` in Facebook Sharing Debugger, X Card Validator, and by pasting into WhatsApp to confirm the invited copy renders.
