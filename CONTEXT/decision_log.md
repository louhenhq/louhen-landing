# Decision Log — Louhen Landing

This file tracks **locked decisions** (do not change without explicit proposal) and the **history of changes**.  
It ensures Codex and contributors never undo critical choices or repeat past discussions.

---

## Locked Decisions

- **Framework**: Next.js App Router with TypeScript + Tailwind.  
- **Hosting**: Vercel.  
- **Data writes**: Firebase Admin SDK (server-side only).  
- **Form security**: hCaptcha required on public submissions.  
- **Emails**: Resend for transactional flows (after domain verification).  
- **Release management**: semantic-release with Conventional Commits.  
- **Testing**: Playwright E2E + Lighthouse CI.  
- **Payments**: Adyen is company-wide provider (not yet used here).  
- **i18n**: next-intl scaffolding; ready for Locize + DeepL later.  
- **Security baseline**: no client-side secrets; GDPR-first handling of PII.

---

## History

- **2025-09-19**  
  Centralized parsing of `WAITLIST_CONFIRM_TTL_DAYS`; expiry deterministic across confirm + resend flows.  

- **2025-09-22**  
  CI artifacts standardized (Playwright, Lighthouse, .next traces). Release job runs `npx semantic-release --debug`.  

- **2025-09-22**  
  Added `/CONTEXT` bundle with agents.md, project_overview.md, decision_log.md, etc. Codex workflow formalized.  

---