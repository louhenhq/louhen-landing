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
- **Environment & Domains locked**: Canonical host `www.louhen.app` (production). Apex `louhen.app` issues 301 redirect to `www.louhen.app`. Preview domain `staging.louhen.app` (maps to `staging` branch). Wildcard previews `*.staging.louhen.app` CNAME to `cname.vercel-dns.com` (DNS only). Deployment Protection does not cover custom production domains without Vercel Business; mitigation is keeping production DNS dark until launch.

---

## History

- **2025-09-19**  
  Centralized parsing of `WAITLIST_CONFIRM_TTL_DAYS`; expiry deterministic across confirm + resend flows.  

- **2025-09-22**  
  CI artifacts standardized (Playwright, Lighthouse, .next traces). Release job runs `npx semantic-release --debug`.  

- **2025-09-22**  
  Added `/CONTEXT` bundle with agents.md, project_overview.md, decision_log.md, etc. Codex workflow formalized.  

---

## 2025-10-01 — Method Page Scope & Rules (LOCKED)

- Route: /[locale]/method/
- Purpose: Trust + education + conversion (waitlist).
- Content blocks: Hero, Trust Strip, Pillars (Scan/Engine/Guarantee), “See the science” disclosure (collapsed by default), How-it-works timeline (5 steps), Testimonial (1), Founder note, FAQ teaser (≥3 links), Final CTA.
- Personalisation: If user logged-in with ≥1 child profile → inject first child’s first name into hero subcopy and 1x timeline line. Fallback to generic if none.
- Mobile CTA: Sticky CTA appears after 25% scroll; respects safe-area and reduced-motion.
- Nudge: If user reaches FAQ without any prior CTA click → inline “exit/scroll” nudge (dismissible). Feature-flagged.
- Icons/visuals: Use illustrations (no stock photos); child-friendly, warm style.
- Accessibility: WCAG 2.2 AA; include skip-to-CTA link; timeline announces “Step X of 5”.
- Analytics events (names LOCKED):
  - method_hero_waitlist_click
  - method_faq_teaser_waitlist_click
  - method_sticky_waitlist_click
  - method_exit_nudge_shown
- Quality bars: Lighthouse SEO ≥95, A11y ≥90, Perf ≥90.

---

- **2025-10-01**  
  Method page v1 finalized with localized copy, analytics parity, Playwright coverage, and Lighthouse gates enforced.
