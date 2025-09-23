# Glossary — Louhen Landing

This glossary ensures that all contributors and Codex use consistent language across copy, code, tests, and docs.  
Terms come from Louhen’s brand, product, and technical foundations.

---

## Brand & Core Terms

- **Louhen**  
  The parent brand. A children’s footwear fit-first companion.  

- **LouhenFit**  
  Louhen’s fit guarantee. Publicly disclosed as a simple trust mark on landing (free returns + “we’ll make it right”), with tiered logic revealed only inside the app.  

- **Louhen Legara**  
  Planned brand name for Louhen’s own shoe line (phase 2). Not relevant for landing, but important for awareness.  

- **Founder Story**  
  Origin of Louhen: inspired when buying shoes for the founder’s twins (Louis + Henry) in a stressful store experience. Core brand narrative used in PR and investor material.  

---

## Product Concepts

- **Fit Confidence**  
  Confidence levels (High, Medium, Low) for sizing accuracy. On landing: referenced lightly as “trust in fit,” details handled in app.  

- **XP / Badges**  
  Light loyalty and gamification system (phase 2, app only). Mention only in future-facing content, not on landing.  

- **Waitlist**  
  Email capture system. Requires captcha + confirmation step. Minimal PII.  

- **Trust Signals**  
  UI elements reinforcing safety & credibility: podiatrist-approved badge, privacy copy, LouhenFit guarantee, secure payments.  

---

## Technical Concepts

- **hCaptcha**  
  Bot prevention solution used on waitlist form.  

- **Resend**  
  Email delivery service (transactional confirmation emails, once domain verified).  

- **Firebase Admin**  
  Used server-side for waitlist writes; never exposed to client.  

- **Semantic-release**  
  Automated versioning and changelog generator using Conventional Commits.  

- **Playwright**  
  E2E testing framework; runs form flows and negative paths.  

- **Lighthouse**  
  Performance, accessibility, SEO, best practices checks in CI.  

- **next-intl**  
  Internationalization library used for message catalogs. Prepared for Locize/DeepL integration in later phases.  

---

## Error Codes (canonical)

Use these codes in server responses and logs. Always pair with a safe `message` for the UI.

- **INPUT_INVALID** — Zod validation failed  
- **CAPTCHA_FAILED** — hCaptcha verification failed  
- **ALREADY_EXISTS** — email already exists in waitlist (if dedup enabled)  
- **TOKEN_INVALID** — confirmation token not found or malformed  
- **TOKEN_EXPIRED** — confirmation token past TTL  
- **INTERNAL_ERROR** — unexpected server error  

---

*If new terms or codes are introduced, update this file immediately. It is the single source of truth for naming across repo and product.*