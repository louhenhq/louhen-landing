# Contributing to Louhen Landing

Thanks for helping build Louhen 👟  
This guide explains the workflow, standards, and guardrails for contributing to **louhen-landing**.

> Always follow **PLAN → DIFF → VALIDATE** before requesting review.

---

## 1) Read This First: /CONTEXT

Before any change, skim:

- /CONTEXT/agents.md — how Codex should work (PLAN → DIFF → VALIDATE → REVERT)
- /CONTEXT/coding_conventions.md — style, structure, commits
- /CONTEXT/decision_log.md — locked decisions (don’t break these)
- /CONTEXT/architecture.md — routes, data flow, envs, CI/CD

VS Code users: a pre-prompt in `.vscode/settings.json` already points Codex to these files.

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

Guardrails

- Do not introduce new dependencies without a 1–2 bullet justification (why, footprint, alternatives).
- Do not change locked decisions (see /CONTEXT/decision_log.md).
- Never log secrets or PII. Redact emails in server logs (ma\*\*\*@example.com).

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

Test matrix
npm run test:unit
npm run test:e2e
npm run test:axe
npm run lighthouse

Need a fresh CI run without pushing? Use the **Run Tests** workflow (Actions tab) or comment
`/test <suite>` on your PR. Suites: `unit`, `e2e`, `axe`, `lhci`, or `all`.

Accessibility & Perf budgets (Lighthouse `/waitlist`)
Performance ≥ 90
Accessibility ≥ 95
Best Practices ≥ 95
SEO ≥ 95

Warn-mode reminder

- a11y, SEO, and CSP checks run in warn mode until Phase 2; even when they warn, upload artifacts (axe, Lighthouse, CSP grep) to the PR.

Negative paths

- For forms/APIs, include at least one failing test (e.g., invalid email, captcha failure).

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

- Every PR runs: lint → build → tests (Playwright) → Lighthouse (artifacts uploaded).
- Merges to `main` trigger `semantic-release` to tag and update CHANGELOG.
- Keep CI logs clean; fail fast on critical errors.

---

## 12) Ready-to-Use PR QA Block

Copy into your PR (already pre-filled by template):

VALIDATE
npm ci
npm run lint
npm run build
npx playwright test # optional if configured
npm run lhci

Manual QA

- [ ] Load `/` → no console errors
- [ ] Submit waitlist with valid email + captcha → success UI, 200 response
- [ ] Invalid email → inline error
- [ ] Missing/invalid captcha → friendly error, no write
- [ ] Lighthouse targets met on `/`

REVERT
git revert <commit> # or restore file(s):
git checkout -- <path>

---

## 13) Code of Conduct

Be kind, direct, and respectful. Assume good intent. We are building for parents and kids; quality and safety matter.

---

### Thank you!

Your contributions help us ship a trustworthy, high-quality experience for families.
