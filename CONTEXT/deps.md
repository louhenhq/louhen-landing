# Dependency Hygiene — Louhen Landing

- **Runtime dependencies are pinned.** Use exact versions in `package.json` for anything that ships to production. Dev/test tooling may use carets, but everything resolves through `package-lock.json`.
- **Renovate cadence:** automated PRs land weekly to bump dependencies. Each PR triggers the full validation matrix (lint → typecheck → build → smoke/critical E2E + unit coverage). Reject bumps that break the matrix until a follow-up fix is merged.
- **New dependency checklist:**
  1. Add a short justification in the PR description (why existing deps are insufficient, expected usage, bundle impact).
  2. Update `/CONTEXT/decision_log.md` if the dependency is long-lived or strategic.
  3. Confirm the package honours our security and licensing policies.
- **Removal before add:** prefer removing dead packages and consolidating functionality before adding new ones.
- **Client bundle guard:** run Lighthouse/Bundle Analyzer on large additions. Coordinate with Product if payload exceeds existing budgets.
- **Security patches:** high/critical advisories escalate to Security Engineering immediately; treat them like production incidents.

Keep this policy in sync with Renovate configuration and CI whenever workflows change.
