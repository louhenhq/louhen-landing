# Release PR Checklist (staging → production)

This PR promotes `staging` → `production`. Please confirm all gates are satisfied before merging.

## Required Checks
- [ ] ✅ CI passed (lint, typecheck, unit, build, e2e, Lighthouse)
- [ ] ✅ `enforce-release-source` status check is green (head = staging)
- [ ] ✅ Required approvals met (2 reviewers)
- [ ] ✅ Branch is up to date with `production`

## Review Items
- [ ] Confirm QA completed on `staging.louhen.app`
- [ ] Verify no force-pushes / direct commits to `production`
- [ ] Ensure CHANGELOG / release notes are up to date
- [ ] Environment variables (Vercel prod) unchanged or reviewed
- [ ] Deployment protection (Vercel) ready for release

## Post-Merge
- [ ] Monitor deployment on `www.louhen.app`
- [ ] Announce release if applicable

