# Contributing to Louhen Landing

Thanks for helping build Louhen 👟  
This guide explains the workflow, standards, and guardrails for contributing to **louhen-landing**.

## Quicklinks
- Locked decisions: [/CONTEXT/decision_log.md](CONTEXT/decision_log.md)
- Naming & structure: [/CONTEXT/naming.md](CONTEXT/naming.md)
- Migration map: [/CONTEXT/rename_map.md](CONTEXT/rename_map.md)
- Testing strategy: [/CONTEXT/testing.md](CONTEXT/testing.md)
- Performance budgets: [/CONTEXT/performance.md](CONTEXT/performance.md)
- Release process: [/CONTEXT/release.md](CONTEXT/release.md)

---

## 1) Read This First: /CONTEXT

Before any change, skim:
- /CONTEXT/agents.md — how Codex should work (PLAN → DIFF → VALIDATE → REVERT)
- /CONTEXT/coding_conventions.md — style, structure, commits
- /CONTEXT/decision_log.md — locked decisions (don’t break these)
- /CONTEXT/architecture.md — routes, data flow, envs, CI/CD
- /CONTEXT/naming.md — repo-wide naming, folders, routing, and selector spec

VS Code users: a pre-prompt in `.vscode/settings.json` already points Codex to these files.

Before you code, reaffirm the PLAN → DIFF → VALIDATE → REVERT ritual and follow the one-feature-per-PR rule when renaming or moving files (see `/CONTEXT/rename_map.md` for planned moves).

---

## 2) Local Setup

Prereqs
- Node LTS (recommended: via nvm)
- npm
- A modern browser for local testing
- (If running E2E) Playwright browsers

Install
    npm ci

Run dev
    npm run dev

Run full checks before a PR
    npm run validate:local

---

## 3) Branching & PRs

- Create a feature/fix branch from `main` (e.g., `feat/waitlist-i18n`).
- Keep changes small and surgical (minimal diff).
- Every PR must include the **QA — Validation Steps** block (auto-added by `.github/pull_request_template.md`).
- When moving files, use `git mv`, keep scope to one feature per PR, and update `/CONTEXT/rename_map.md` if the destination diverges from the plan.
- Run `npm run typecheck:build` before opening or updating a PR to ensure the production build config remains green.
- Prefer path aliases (`@components/...`, `@lib/...`, etc.) over deep relative imports as files migrate.
- When moving files, use `git mv`, keep scope to one feature per PR, and update `/CONTEXT/rename_map.md` if the destination diverges from the plan.

PR size & scope
- One logical change per PR.
- Avoid drive-by refactors; if a refactor is needed, split it into its own PR.

Screenshots
- For UI changes, add before/after screenshots or a short recording.

---

## 4) Commit Style (semantic-release)

Use Conventional Commits:
- feat(scope): add new capability
- fix(scope): address a bug
- chore(scope): tooling/maintenance
- docs(scope): documentation only
- refactor(scope): code change w/o behavior change
- test(scope): tests added/updated
- ci(scope): pipeline changes

Examples
- feat(waitlist): add server captcha verification
- fix(ci): upload lighthouse report artifact
- docs(context): add architecture overview

---

## 5) How to Work with Codex (AI) Effectively

Use the ritual below. It makes reviews faster and safer.

PLAN
    ≤8 steps, list files to touch, and rationale.

DIFF
    Unified diffs only for changed files. No unrelated formatting/import churn.

VALIDATE
    Exact commands to run, plus a short manual QA checklist.

REVERT
    Git commands to roll back if validation fails.

Renames must reference `/CONTEXT/rename_map.md`; update the table in the PR if plan deviates.

Guardrails
- Do not introduce new dependencies without a 1–2 bullet justification (why, footprint, alternatives).
- Do not change locked decisions (see /CONTEXT/decision_log.md).
- Never log secrets or PII. Redact emails in server logs (ma***@example.com).

---

## 6) Environment Variables

All secrets live in Vercel envs. Do **not** put secrets in the repo.

Required (see /CONTEXT/architecture.md):
- FIREBASE_ADMIN_SA_B64, FIREBASE_PROJECT_ID, FIREBASE_DB_REGION
- NEXT_PUBLIC_HCAPTCHA_SITE_KEY, HCAPTCHA_SECRET
- RESEND_API_KEY, RESEND_FROM, RESEND_REPLY_TO
- APP_BASE_URL, WAITLIST_CONFIRM_TTL_DAYS

Add guard clauses for missing envs (fail fast with clear, friendly errors).

---

## 7) Testing

- **Single entry point:** `npm run validate:local` mirrors CI (lint → typecheck → build → production server → unit → Playwright e2e + axe → Lighthouse) and writes reports to `artifacts/playwright/` and `artifacts/lighthouse/`. Run it before requesting review.
- **Playwright projects:** `desktop-chromium` runs everything by default; add `@mobile` to suites that must run on the `mobile-chromium` project, and use `@desktop-only` to opt out when behaviour diverges.
- **Targeted commands:**
  - `npm run test:e2e` — full Playwright suite (desktop + tagged mobile).
  - `npm run test:axe` — axe scans on the canonical desktop viewport.
  - `npm run lhci` — Lighthouse CI thresholds (`/`, `/waitlist`, `/method`).
- Accessibility checks live in `tests/axe/canonical.axe.ts`; update the canonical matrix instead of creating new axe suites.
- **Negative paths:** Always cover at least one failing case for forms/APIs (invalid email, captcha failure, etc.).
- **Budgets:** Lighthouse thresholds stay Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, Best Practices ≥ 95.
- **Guardrails:** Import `test`/`expect` from `@tests/fixtures/playwright`, prefer `data-testid` selectors, avoid `page.waitForTimeout`, intercept new third-party calls in the fixture, and mark unstable specs with `@quarantine` + a tracking issue. Lighthouse budgets live in `lighthouse-budgets.json`; raise limits only after sustained headroom (≥5 green runs).

---

## 8) Security & Privacy

- No client-side secrets.
- Minimal PII (email, locale, UTM, timestamps).
- Redact sensitive data in logs; never log tokens or raw headers containing PII.
- If you see a security concern, open a private issue or contact a maintainer directly.

---

## 9) Dependencies

Before adding a dependency, include in the PR:
- Why it’s needed (1–2 bullets)
- Size/maintenance considerations
- Alternatives considered

Remove unused deps when discovered.

---

## 10) Issue Templates

Use the GitHub templates:
- 🐞 Bug report
- ✨ Feature request

Blank issues are disabled; for questions, use Discussions (link in issue config).

---

## 11) Release & CI

- Every PR and push to `staging` runs the unified pipeline (policy guards → build/test job mirroring `npm run validate:local`).
- Releases happen by promoting `staging` → `production`; pushes to `production` run `semantic-release` to tag and update the changelog.
- Keep CI logs clean; fail fast on critical errors.

---

## 12) Ready-to-Use PR QA Block

Copy into your PR (already pre-filled by template):

VALIDATE
    npm ci
    npm run validate:local

Manual QA
- [ ] Load `/` → no console errors
- [ ] Submit waitlist with valid email + captcha → success UI, 200 response
- [ ] Invalid email → inline error
- [ ] Missing/invalid captcha → friendly error, no write
- [ ] Check `artifacts/lighthouse/summary.md` (scores & budgets) or rerun `npm run lhci` locally if needed

REVERT
    git revert <commit>
    # or restore file(s):
    git checkout -- <path>

---

## 13) Code of Conduct

Be kind, direct, and respectful. Assume good intent. We are building for parents and kids; quality and safety matter.

---

### Thank you!
Your contributions help us ship a trustworthy, high-quality experience for families.
