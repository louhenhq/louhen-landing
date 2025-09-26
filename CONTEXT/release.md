# Release Process — Staging → Production

The full flow is defined in `architecture.md` (§14). Use this doc as the quick reference for staging promotions.

## Steps at a glance

1. Merge feature branches into `staging` via standard pull requests.
2. Open a release PR from `staging` into `production` once QA on `https://staging.louhen.app` completes.
3. Apply the template `.github/pull_request_template_release.md` and ensure every checklist item is satisfied before approval.

## Required status checks

- `enforce-release-source`
- `Enforce Release PR Checklist`

Both checks must remain marked **Required** on the `production` branch ruleset.

## Emergency bypass

- Label: `skip-checklist`
- Conditions: Include justification in the PR description and obtain Release Manager approval before merging. Use only when urgent fixes cannot wait for full checklist completion.
