# agents.md — Repo Operating Rules

This file defines how Codex (and other AI assistants) must operate inside this repo.

---

### Validation Policy (MANDATORY)
- After every DIFF, Codex **must** perform VALIDATE locally and include the raw command outputs in the reply.
- Minimum VALIDATE command: `npm run validate:local` (runs lint, build, unit tests).
- If a change touches routing, SEO, or end-to-end behaviour, Codex must also run `npm run validate:e2e:dev` (or explicitly justify why it was skipped) and include its logs.
- If any validation command fails, Codex must stop, surface the logs, and await guidance before proceeding.

---

## 1) Roles

- **Architect Agent**  
  Proposes minimal, future-proof designs. Breaks tasks into small, composable steps. Flags risks and trade-offs.

- **Implementer Agent**  
  Produces precise unified diffs only. Touches the fewest lines needed. Always respects conventions and locked decisions.

- **QA Agent**  
  Provides validation commands, manual QA checklists, and rollback steps.

**Pipeline:** Architect → Implementer → QA

---

## 2) Priorities (in order)

1. **Correctness & Safety** — auth, data, secrets, payments, PII  
2. **Scalability & Maintainability** — typed contracts, clean boundaries, small modules  
3. **Minimal Diffs** — surgical edits, no drive-by refactors  
4. **Developer Experience** — clear errors, helpful logs, comments where non-obvious

---

## 3) Locked Decisions (must not be violated)

- Framework: **Next.js App Router + TypeScript + Tailwind**
- Hosting: **Vercel**
- Email: **Resend** (once domain is verified)
- Human verification: **hCaptcha**
- Data ops: **Firebase Admin** (server-side only)
- Release mgmt: **semantic-release** with Conventional Commits
- E2E: **Playwright** + Lighthouse checks in CI
- i18n: **next-intl** (prepared for Locize/DeepL later)
- Security: **no client-side secrets**, GDPR-first handling of any PII

If a suggestion conflicts with any of the above → **stop and flag alternatives**.

---

## 4) Command Syntax (Codex must use these)

- **PLAN** — ≤ 8 steps, include file paths & brief rationale  
- **DIFF** — unified diff for changed files only (no formatting noise)  
- **NEW FILE** — full path + entire file content  
- **VALIDATE** — exact shell commands + manual QA checklist  
- **REVERT** — git commands to undo the change

**Examples (for format, not to execute verbatim):**

PLAN
    1) Edit app/api/waitlist/route.ts → add Zod validation.
    2) Add lib/verifyCaptcha.ts for hCaptcha server check.
    3) Write Playwright test for invalid captcha.

DIFF
    --- a/app/api/waitlist/route.ts
    +++ b/app/api/waitlist/route.ts
    @@ -12,6 +12,15 @@
    + // Added: server-side hCaptcha verification

NEW FILE
    PATH: lib/verifyCaptcha.ts
    CONTENT:
      export async function verifyCaptcha(token: string) { /* … */ }

VALIDATE
    npm ci
    npm run lint
    npm run build
    npx playwright test
    # If configured:
    npm run lhci
    Manual QA:
    - Open “/”
    - Submit waitlist form with valid email + captcha
    - Expect success UI and Firestore write (server logs show 200)

REVERT
    git checkout -- app/api/waitlist/route.ts lib/verifyCaptcha.ts

---

## 5) Guardrails

- No new dependencies without a short justification (why needed, impact, size).
- No breaking API changes without a migration note and acceptance steps.
- Keep diffs focused; avoid unrelated formatting/import churn.
- For any ambiguity, list assumptions at the end of the response.
- Never log or echo secrets. Redact emails or PII in logs.

---

## 6) Review Checklist (auto-include in PRs)

- [ ] Follows feature boundaries & conventions  
- [ ] Minimal diff; no unrelated formatting  
- [ ] Tests/QA steps provided & passing (Playwright where applicable)  
- [ ] Useful telemetry/logging without leaking PII  
- [ ] Docs updated if needed (`/CONTEXT` or README)

---

## 7) How to Ask Codex (templates you can paste)

**Small change**
    Architect: PLAN (≤ 6 steps).  
    Implementer: DIFF only for the files listed.  
    QA: VALIDATE (commands) + Manual QA + REVERT.

**Refactor (strangler pattern)**
    Architect: PLAN adapter layer first (no behavior change), risks, rollout.  
    Implementer: DIFF for adapter + wiring only.  
    QA: VALIDATE with smoke tests.

**New module**
    Architect: PLAN folder structure, interfaces, and deps (justify).  
    Implementer: NEW FILE(s) with TODOs where acceptable.  
    QA: VALIDATE with a basic test and manual steps.

---

## 8) Glossary Reference

Use `glossary.md` for consistent domain terms (LouhenFit, Fit Confidence, XP, etc.). Keep copy, code, and tests aligned with these terms.

---

## 9) Pre-Prompt (optional, for .vscode/settings.json)

Put this in the workspace settings to prime Codex automatically:

    "chat.prompt": "You are Codex for the Louhen Landing repo. Before any change, read /CONTEXT/agents.md and /CONTEXT/decision_log.md. Obey locked decisions. Use PLAN → DIFF → VALIDATE → REVERT. Keep diffs surgical. No new deps without a short justification."
