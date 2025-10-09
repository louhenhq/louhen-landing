# Pull Request

> Please review /CONTEXT/decision_log.md before merging. Keep diffs surgical and follow PLAN → DIFF → VALIDATE.
> For release PRs (`staging → production`), please use `.github/pull_request_template_release.md`.

## Summary
- What changed & why (1–2 lines):

<<<<<<< HEAD
## Method Page Checklist (mark if this PR touches `/[locale]/method/`)
- [ ] i18n parity: EN/DE keys for `method.*` are complete and updated.
- [ ] Links resolve: FAQ teaser links, privacy disclosure link, and final CTA anchor (`#join-waitlist`).
- [ ] Analytics events: hero/FAQ/sticky/nudge emit with the expected payload (`locale`, `route`, `position`, `variant_personalized`, `timestamp`).
- [ ] Reduced motion respected; `tests/e2e/method-accessibility.spec.ts` passes without a11y violations.
- [ ] Lighthouse thresholds met on `/{DEFAULT_LOCALE}/method/` (Perf ≥90, SEO ≥95, A11y ≥90, Best Practices ≥90).
- [ ] `/method` redirect preserves queries and resolves to the localized canonical with trailing slash.
- [ ] Validated in sandbox mode (`npm run validate:sandbox`) where applicable (optional for Codex runs).

## Design Integrity Checklist
- [ ] All landing/marketing buttons/inputs/cards use the unified primitives (no bespoke `buttons.*`/manual focus classes).
- [ ] Button variants (primary/secondary/ghost/destructive) and sizes (sm/md/lg) follow guidance; focus-visible rings remain visible on every state.
- [ ] Inputs wire labels + `aria-describedby` for help/error text; invalid states rely on feedback tokens; checkbox hit-area stays large and accessible.
- [ ] Card variants are consistent (surface/outline/ghost) with tokenised motion; hover lift respects `prefers-reduced-motion`.
- [ ] No raw hex/radius/shadow declarations in consumers—only token utilities or the primitives themselves.
- [ ] Uses `[data-theme="dark"]` strategy with SSR initialiser; no theme flash on load.
- [ ] Theme toggle supports System/Light/Dark, persists selection, and “System” matches OS settings.
- [ ] Dark tokens mapped across backgrounds/text/borders/focus/shadows with AA contrast verified on touched surfaces.
- [ ] Tailwind configured for data-theme; any legacy `dark:` usage reviewed or migrated; no raw hex overrides.
- [ ] Imagery stays neutral (no CSS inversion); reduced-motion behaviour unchanged across themes.
- [ ] Uses tokens (no raw hex/radii/shadows).
- [ ] Headings use `text-display-*` / `text-h3` utilities (Fraunces).
- [ ] Body/UI uses Inter utilities (`text-body`, `text-body-sm`, `text-label`).
- [ ] No component-level hardcoded `font-family` or `text-[N]` utilities.
- [ ] Hero H1 allows 1–2 lines with no overflow/truncation at 320px.
- [ ] Hero split layout keeps to the 12-col shell, includes the LouhenFit micro-trust line, and fixes media aspect ratio/reduced-motion guards.
- [ ] Trust Bar appears directly under Hero on landing and uses shell/grid helpers.
- [ ] Exactly four claims: Podiatrist, GDPR/data safety, Free returns (LouhenFit), Payments by Adyen.
- [ ] Icons stay neutral (tokens only) and labels use `text-label`/`text-body-sm`; AA contrast holds in light/dark.
- [ ] A11y: hidden section heading + item aria-labels; focus states visible if interactive.
- [ ] Responsive: desktop row and mobile 2x2 (or snap) without overflow or layout shift.
- [ ] Uses 12-col shell helpers and tokenized gaps for How-it-Works (no bespoke margins).
- [ ] Three How-it-Works steps (Scan, Match, Happy feet) use `text-h3` + `text-body` utilities and meet copy length guards.
- [ ] Illustration slots declare aspect ratio (>=4/3) to avoid CLS; reduced-motion respected for card entrances.
- [ ] Optional deep links use tokenised button/link styles with visible focus and locale-aware paths.
- [ ] Waitlist CTA uses shell/grid helpers with tokens + type utilities only.
- [ ] Email + consent + inline hCaptcha appear before submit and server verification stays intact.
- [ ] Error summary (`role="alert"`) plus field-level errors; focus moves to the first invalid control; success panel receives focus.
- [ ] EN/DE strings localised; AA contrast and reduced-motion honoured.
- [ ] Captcha/errors reserve space to avoid CLS; responsive layout validated at 320px.
- [ ] Layout shell helpers (`SiteShell`, `layout.container`/`layout.section`) used; no bespoke max-width/margins; header/footer pass AA contrast + focus-visible.
- [ ] Focus-visible styles present on interactive elements.
- [ ] Dark mode checked or neutral (no regressions).
- [ ] i18n length tested (DE strings fit) in hero/section titles.
- [ ] Reduced-motion respects user preference.
- [ ] Lighthouse mobile ≥ targets (Perf ≥ 90, A11y ≥ 100, SEO ≥ 95) for touched pages.
- [ ] aXe: 0 critical violations for touched pages.

## Performance & Accessibility Checklist
- [ ] Lighthouse mobile meets Perf ≥ 90, A11y = 100, SEO ≥ 95 on touched routes.
- [ ] CLS ≤ 0.05, LCP element sized & stable; fonts preloaded once with `display: swap`.
- [ ] aXe: 0 critical; headings/landmarks correct; focus visible; AA contrast holds in light and dark modes.
- [ ] Images use `next/image` or explicit width/height; Lottie ≤ 150 KB or deferred/disabled under reduced motion.
- [ ] No raw hex/radii/shadows or `console`/`debugger` in shipped code; tokens/utilities only.
- [ ] `npm run validate:local` artifacts (Playwright, axe, Lighthouse) attached to the PR; failures block merge until resolved.

## Trust Copy Checklist
- [ ] Trust copy pulls from `trustCopy.*` (LouhenFit, GDPR, payment, coverage); nothing hardcoded.
- [ ] Hero, Waitlist, Checkout/Confirmation/Returns display the correct reassurance lines and mention Adyen for payments.
- [ ] Copy localised in EN/DE, fits ≤ 2 lines at 320px, and maintains AA contrast.
- [ ] Coverage states use the appropriate `trustCopy.coverage.*` string (named when a child profile is present).
- [ ] Links to Terms/Privacy/Adyen stay focusable with visible rings; screen readers announce trust messaging once.

## i18n & Locale Chrome Checklist
- [ ] BCP-47 path prefixes in place; `/` acts as x-default; legacy rewrites (e.g., `/de/ → /de-de/`) configured.
- [ ] Locale switcher preserves path/query/hash, keeps focus, announces changes, and writes the `louhen_locale` cookie.
- [ ] Per-page canonical + hreflang (all locales + x-default) emitted via shared helpers.
- [ ] Sitemaps include per-locale alternates; robots references them and obeys pre-launch `Disallow: /` policy until `NEXT_PUBLIC_ALLOW_INDEXING=true` on production.
- [ ] No bot geo-redirects; suggestions only for humans; cookie precedence documented.
- [ ] EN/DE copy verified at 320px; FR scaffolding committed with placeholder markers.

> If any item cannot be satisfied, include rationale and a follow-up issue link.

=======
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
## Checklist (trust, privacy, governance)
- [ ] **Consent**: Analytics initialize only after opt-in; no surprise trackers added.  
- [ ] **CSP Nonce**: No inline scripts without a nonce; JSON-LD keeps nonce parity.  
- [ ] **Security Headers**: HSTS, Referrer-Policy, Permissions-Policy, and X-Frame-Options remain enforced.  
- [ ] **Email Compliance**: List-Unsubscribe (mailto + one-click), List-Unsubscribe-Post, Auto-Submitted, and Reply-To headers accounted for.  
- [ ] **Status Endpoint**: `/api/status` still requires Basic Auth and returns the required keys.  
- [ ] **i18n/SEO**: BCP-47 routes, hreflang, canonical host, and preview `noindex` remain correct.  
- [ ] **Env Review**: No secrets slipped into git; Vercel envs updated for this change.

## Validation
- Commands run (lint/build/test/e2e/lighthouse) + brief results:
- Manual QA notes (if any):

## Risk & Rollback
- Risk level: ☐ Low ☐ Medium ☐ High  
- Rollback plan: `git revert <commit>` or re-deploy previous build.
