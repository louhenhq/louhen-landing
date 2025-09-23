# Project Overview — Louhen Landing

This repo powers the **Louhen Landing / Waitlist site**.  
It is a lean, fast, and reliable entry point for parents to discover Louhen and join the early access waitlist.

---

## 1) Goals

- Convert qualified parents into waitlist signups.  
- Communicate Louhen’s **value proposition** (fit-first footwear, trust, ease).  
- Build trust with parents, investors, and early partners.  
- Serve as a foundation for SEO and PR campaigns.  
- Be **production-grade**: stable, secure, and easy to maintain.

---

## 2) Non-Goals

- Full eCommerce — handled by the Louhen App.  
- Heavy CMS workflows — keep copy portable and light.  
- Multi-brand support — only Louhen brand here.

---

## 3) Success Metrics

- **Conversion**: waitlist signups per unique visitor.  
- **Performance**: Lighthouse scores  
  - Perf ≥ 90  
  - Accessibility ≥ 95  
  - SEO ≥ 95  
  - Best Practices ≥ 95  
- **Stability**: <1% error rate on waitlist submissions.  
- **Security**: No PII leakage; GDPR compliance from day one.

---

## 4) Tech Stack

- **Next.js (App Router) + TypeScript**  
- **Tailwind CSS**  
- **next-intl** for i18n scaffolding  
- **Firebase Admin** (server-side only) for waitlist writes  
- **hCaptcha** for human verification  
- **Resend** for transactional emails (once domain verified)  
- **Playwright** for E2E + **Lighthouse CI** in GitHub Actions  
- **semantic-release** for automated versioning & changelog

---

## 5) Environments & Secrets (set in Vercel)

- `FIREBASE_ADMIN_SA_B64` — base64 service account JSON  
- `FIREBASE_PROJECT_ID`  
- `FIREBASE_DB_REGION`  
- `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`  
- `HCAPTCHA_SECRET`  
- `RESEND_API_KEY`  
- `RESEND_FROM`  
- `RESEND_REPLY_TO`  
- `APP_BASE_URL`  
- `WAITLIST_CONFIRM_TTL_DAYS`

---

## 6) Release & CI

- **CI jobs**: lint → build → unit tests → Playwright → Lighthouse (artifacts uploaded).  
- **Release job**: triggered on `main`, runs `semantic-release` with GitHub + changelog updates.  
- **Artifacts**: Playwright HTML report, Lighthouse report, .next traces.

---

## 7) Context for Agents

When Codex works in this repo, it should:
- Prioritise correctness, security, and scalability.  
- Respect locked decisions (see `decision_log.md`).  
- Always provide **PLAN → DIFF → VALIDATE → REVERT**.

---

*This document sets the big picture. For detailed coding rules, see `coding_conventions.md`.*