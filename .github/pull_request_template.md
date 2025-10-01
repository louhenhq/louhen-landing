# Pull Request

> Please review /CONTEXT/decision_log.md before merging. Keep diffs surgical and follow PLAN → DIFF → VALIDATE.
> For release PRs (`staging → production`), please use `.github/pull_request_template_release.md`.

## Summary
- What changed & why (1–2 lines):

## Method Page Checklist (mark if this PR touches `/[locale]/method/`)
- [ ] i18n parity: EN/DE keys for `method.*` are complete and updated.
- [ ] Links resolve: FAQ teaser links, privacy disclosure link, and final CTA anchor (`#join-waitlist`).
- [ ] Analytics events: hero/FAQ/sticky/nudge emit with the expected payload (`locale`, `route`, `position`, `variant_personalized`, `timestamp`).
- [ ] Reduced motion respected; `tests/e2e/method-accessibility.spec.ts` passes without a11y violations.
- [ ] Lighthouse thresholds met on `/{DEFAULT_LOCALE}/method/` (Perf ≥90, SEO ≥95, A11y ≥90, Best Practices ≥90).
- [ ] `/method` redirect preserves queries and resolves to the localized canonical with trailing slash.
- [ ] Validated in sandbox mode (`npm run validate:sandbox`) where applicable (optional for Codex runs).

## Design Integrity Checklist
- [ ] Uses tokens (no raw hex/radii/shadows).
- [ ] Headings use `text-display-*` / `text-h3` utilities (Fraunces).
- [ ] Body/UI uses Inter utilities (`text-body`, `text-body-sm`, `text-label`).
- [ ] No component-level hardcoded `font-family` or `text-[N]` utilities.
- [ ] Hero H1 allows 1–2 lines with no overflow/truncation at 320px.
- [ ] Layout shell helpers (`SiteShell`, `layout.container`/`layout.section`) used; no bespoke max-width/margins; header/footer pass AA contrast + focus-visible.
- [ ] Focus-visible styles present on interactive elements.
- [ ] Dark mode checked or neutral (no regressions).
- [ ] i18n length tested (DE strings fit) in hero/section titles.
- [ ] Reduced-motion respects user preference.
- [ ] Lighthouse mobile ≥ targets (Perf ≥ 90, A11y ≥ 100, SEO ≥ 95) for touched pages.
- [ ] aXe: 0 critical violations for touched pages.

> If any item cannot be satisfied, include rationale and a follow-up issue link.

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
