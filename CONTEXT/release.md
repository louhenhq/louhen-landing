# Release & Versioning — Louhen Landing

semantic-release automates tagging, changelog generation, and GitHub Releases. Branch policy and scripts are locked in [/CONTEXT/decision_log.md](decision_log.md); this doc is the quick reference for day-to-day work.

## Branch Model
- `staging` — default integration branch. All feature PRs target `staging`; every merge must pass `policy-guards` and `build-and-test`.
- `production` — protected release branch. Only promotion path is a PR from `staging` → `production`. Semantic-release runs on pushes to `production` and publishes the stable channel.
- No direct pushes to `production`; branch protection enforces required checks and disallows merges unless the head branch is `staging`.

## semantic-release Configuration
- Plugin set (see `.releaserc.json`):
  - `@semantic-release/commit-analyzer`
  - `@semantic-release/release-notes-generator`
  - `@semantic-release/changelog`
  - `@semantic-release/npm`
  - `@semantic-release/github`
  - `@semantic-release/git`
- Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, etc.) as documented in [/CONTRIBUTING.md](../CONTRIBUTING.md). Breaking changes require `!` or `BREAKING CHANGE:` footer.
- Release PRs must keep the generated changelog diff intact; reviewers confirm semantic-release will produce the expected version bump.

## Promotion Flow (Staging → Production)
1. Merge feature branches into `staging`; CI (policy-guards + build-and-test) must pass.
2. Validate the integrated work on `https://staging.louhen.app`.
3. Open a PR from `staging` to `production`. Required checks: `policy-guards`, `build-and-test`, `enforce-release-source`, and `Enforce Release PR Checklist`.
4. Once the PR is approved and green, merge it. The push to `production` reruns the same pipeline and, after success, the `release` job executes `semantic-release` (stable channel).
5. Monitor the release job for the published version, GitHub Release, changelog commit, and any npm tags.


## Approvals & Roles
- Feature PRs into `staging` require review by at least one maintainer.
- Release PR (`staging` → `production`) must be approved by the release manager plus one additional engineer before merge.
- CI checks (`policy-guards`, `build-and-test`) must be green on the PR branch; `enforce-release-source` and `Enforce Release PR Checklist` guard production merges automatically.

## Vercel Deployments
- Production branch `production` deploys to https://www.louhen.app.
- Preview branch `staging` is aliased to https://staging.louhen.app (Latest Preview); all other branches get ephemeral previews.
- Prelaunch features (`IS_PRELAUNCH`, robots `noindex`) stay enabled on staging/preview environments; production disables them automatically.
- Only the `production` branch can promote a deploy to Production; do not use the Vercel UI to promote other previews.

## Required Status Checks
- `policy-guards`
- `build-and-test`
- `enforce-release-source` (production PRs only)
- `Enforce Release PR Checklist` (production PRs only)

These checks are marked **Required** on `staging` (first two) and `production` (all four).

## Emergency Bypass
- Use label `skip-checklist` only when approved by the Release Manager.
- Document rationale and risk mitigation in the PR description; follow up with a postmortem entry in `/CONTEXT/decision_log.md` if the bypass exposed gaps.

## Rollbacks
- Use `git revert` on the offending merge commit (do not force push).
- Run semantic-release dry-run to confirm versioning after rollback.
- Notify ops on Slack and update the release notes with the rollback state.
- When release branches contain structural file moves, double-check paths against [/CONTEXT/naming.md](naming.md) and update [/CONTEXT/rename_map.md](rename_map.md) before tagging.
