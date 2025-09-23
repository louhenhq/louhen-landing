# Pull Request

> Please review /CONTEXT/decision_log.md before merging. Keep diffs surgical and follow PLAN → DIFF → VALIDATE.

## Summary
- What changed & why (1–2 lines):

## Checklist (trust, privacy, SEO)
- [ ] **Consent**: Analytics initialize only *after* opt-in. No third-party CMP added.  
- [ ] **CSP Nonce**: No new inline scripts without `nonce`. JSON-LD uses nonce.  
- [ ] **Security Headers**: Middleware still sets HSTS, Referrer-Policy, X-Content-Type-Options, Permissions-Policy, X-Frame-Options.  
- [ ] **Transactional Email**: `List-Unsubscribe` (mailto + one-click URL), `List-Unsubscribe-Post`, `Auto-Submitted`, and `Reply-To` present.  
- [ ] **Suppression**: All send paths call `shouldSend()`; suppressed emails are skipped (logged).  
- [ ] **SEO**: Page has `generateMetadata` with canonical/description; internal pages (e.g., /status) are `noindex`.  
- [ ] **Sitemap/Robots**: `/status` not in sitemap; preview builds set `noindex`.  
- [ ] **Lighthouse**: All categories ≥ 0.90 (target SEO ≥ 0.98).  
- [ ] **Playwright**: E2E passes; consent granted programmatically; selectors are robust.  
- [ ] **Envs**: Any new envs documented in README and scoped in Vercel (prod/preview).  
- [ ] **Docs-only change** (skip checks above): ☐

## Validation
- Commands run (lint/build/test/e2e/lighthouse) + brief results:
- Manual QA notes (if any):

## Risk & Rollback
- Risk level: ☐ Low ☐ Medium ☐ High  
- Rollback plan: `git revert <commit>` or re-deploy previous build.
