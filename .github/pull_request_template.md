# Pull Request

> Please review /CONTEXT/decision_log.md before merging. Keep diffs surgical and follow PLAN → DIFF → VALIDATE.
> For release PRs (`staging → production`), please use `.github/pull_request_template_release.md`.

## Summary
- What changed & why (1–2 lines):

## Checklist (trust, privacy, governance)
- [ ] **Consent**: Analytics initialize only after opt-in; no surprise trackers added.  
- [ ] **CSP Nonce**: No inline scripts without a nonce; JSON-LD keeps nonce parity.  
- [ ] **Security Headers**: HSTS, Referrer-Policy, Permissions-Policy, and X-Frame-Options remain enforced.  
- [ ] **Email Compliance**: List-Unsubscribe (mailto + one-click), List-Unsubscribe-Post, Auto-Submitted, and Reply-To headers accounted for.  
- [ ] **Status Endpoint**: `/api/status` still requires Basic Auth and returns the required keys.  
- [ ] **i18n/SEO**: BCP-47 routes, hreflang, canonical host, and preview `noindex` remain correct.  
- [ ] Canonical/hreflang present & correct for localized pages.  
- [ ] Sitemap entries updated if this PR adds a new route.  
- [ ] Preview workflow artifacts reviewed on failures (HTML report + traces).  
- [ ] **Env Review**: No secrets slipped into git; Vercel envs updated for this change.

## Design System
- [ ] No raw hex/rgb/hsl values added in components.
- [ ] No arbitrary Tailwind color/shadow utilities (`bg-[…]`, `text-[…]`, `shadow-[…]`).
- [ ] Semantic utilities or token-mapped scales used for new styling.

## Validation
- Commands run (lint/build/test/e2e/lighthouse) + brief results:
- Manual QA notes (if any):

## Risk & Rollback
- Risk level: ☐ Low ☐ Medium ☐ High  
- Rollback plan: `git revert <commit>` or re-deploy previous build.
