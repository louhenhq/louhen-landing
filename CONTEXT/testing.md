# Testing Strategy — Louhen Landing

Testing follows the locked pyramid in [/CONTEXT/decision_log.md](decision_log.md): fast unit coverage, Playwright end-to-end flows, and automated axe accessibility scans. Use this guide when planning or reviewing changes.

## Responsibilities

| Layer | What it covers | Tooling | Expectations |
| --- | --- | --- | --- |
| Unit (`tests/unit/`) | Pure functions, hooks, server utilities (`lib/shared`, `lib/server`) | Vitest (JSDOM/Node) | Fast, deterministic, no network or timers. Snapshot only when meaningful. |
| End-to-End (`tests/e2e/`) | Full user journeys: waitlist submit, method flow, header/nav, legal routes, status API | Playwright | Run against local server by default (`npx playwright test`); record validation steps in PRs. Targeted retries allowed (≤2) using built-in flake policy. |
| Accessibility (`tests/axe/`) | Axe-core audits for critical pages (landing, waitlist, legal, method, status) | Playwright + `@axe-core/playwright` | Fail on serious/critical issues. Respect reduced-motion and theme toggles during scans. |

## Selector Guidance
- Use `data-ll="..."` attributes for all selectors referenced in Playwright or axe specs. Never rely on classes, DOM order, or localized text.
- Align selector IDs with the entries in [/CONTEXT/rename_map.md](rename_map.md) and directory rules in [/CONTEXT/naming.md](naming.md) so future moves keep tests readable.
- When adding a new selector, update the relevant feature table in `rename_map.md` and include the attribute in the component diff.
- **Method selectors:** `method-hero`, `method-hero-cta`, `method-pillars`, `method-how`, `method-steps`, `method-trust`, `method-footer-cta`.

## Flake Policy
- Playwright tests may use `retries: 1` globally; additional retries require an issue link and temporary `test.fixme`.
- Tag quarantined tests with `_legacy` folder or `test.describe.skip` plus backlog issue. Remove skip tags within the next slice.
- Use `--workers=1 --reporter=line` locally when reproducing flakes. Capture HAR traces (`npx playwright test --trace on`) for debugging.

## Adding or Changing Tests
- Follow PLAN → DIFF → VALIDATE → REVERT (documented in [/CONTRIBUTING.md](../CONTRIBUTING.md)).
- Include validation commands in the PR checklist (unit, build, Playwright, axe as needed).
- For new journeys, ensure analytics assertions respect consent (see [/CONTEXT/analytics_privacy.md](analytics_privacy.md)).

## CI Expectations
- GitHub Actions runs `npm run lint`, `npm run build`, `npx playwright test`, and Lighthouse. Failing tests block merge.
- Upload Playwright HTML + trace reports and axe logs; link them in PRs when investigating failures.
- Treat consistent flakes as blocking issues—open a ticket in `/CONTEXT/backlog.md` with reproduction steps.
