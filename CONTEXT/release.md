# Release & Versioning — Louhen Landing

semantic-release automates tagging, changelog generation, and GitHub Releases. Branch policy and scripts are locked in [/CONTEXT/decision_log.md](decision_log.md); this doc is the quick reference for day-to-day work.

## Branch Model
- `main` — production branch; semantic-release runs here (channel: latest).
- `next` — prerelease branch (channel: next). Use for beta features or documentation of upcoming work.
- `beta` — optional prerelease channel when testing long-running features; publish with `dist-tag=beta`.
- Feature branches must merge into `main` via PRs; no direct pushes.

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
1. Validate work on `https://staging.louhen.app` (branch `main`).
2. When ready to ship, ensure CI is green and run a dry-run locally:  
   ```bash
   npx semantic-release --dry-run --no-ci
   ```  
   Use temporary GitHub/Vercel tokens or `GH_TOKEN` from a PAT with `repo` scope.
3. Merge to `main`; GitHub Actions runs the full semantic-release pipeline.
4. Monitor the workflow logs for published version, npm dist-tag, GitHub Release, and changelog commit.

## Required Status Checks
- `enforce-release-source`
- `Enforce Release PR Checklist`
- `ci (lint, build, playwright, lighthouse)` — composite check produced by Actions workflow.

These checks remain **Required** on `main` and prerelease branches.

## Emergency Bypass
- Use label `skip-checklist` only when approved by the Release Manager.
- Document rationale and risk mitigation in the PR description; follow up with a postmortem entry in `/CONTEXT/decision_log.md` if the bypass exposed gaps.

## Rollbacks
- Use `git revert` on the offending merge commit (do not force push).
- Run semantic-release dry-run to confirm versioning after rollback.
- Notify ops on Slack and update the release notes with the rollback state.
- When release branches contain structural file moves, double-check paths against [/CONTEXT/naming.md](naming.md) and update [/CONTEXT/rename_map.md](rename_map.md) before tagging.
