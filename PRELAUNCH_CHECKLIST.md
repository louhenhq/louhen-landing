# Prelaunch Checklist — Louhen Landing

All items must be checked before staging → production promotion.

---

## Security

- [ ] CSP grep clean — Acceptance: scan of built HTML shows no inline scripts or styles without nonce (see `ci-artifacts/csp-report.txt`).
- [ ] SBOM captured — Acceptance: CycloneDX artifact generated and attached to release PR.
- [ ] Secrets parity verified — Acceptance: Staging vs production secrets reviewed against `CONTEXT/envs.md`, rotations logged.

## Privacy

- [ ] Consent banner behaviour — Acceptance: Production shows consent UI and blocks analytics until opt-in; preview hides banner with analytics disabled.
- [ ] Email headers confirmed — Acceptance: Latest transactional test email includes `List-Unsubscribe`, `List-Unsubscribe-Post`, `Auto-Submitted`, and `Reply-To`.

## Performance

- [ ] Lighthouse budgets met — Acceptance: Mobile run on `/[locale]/` and `/[locale]/method/` >=90 Performance, >=95 SEO, >=90 Best Practices.
- [ ] Hero media budget — Acceptance: Lottie/video assets <=250 KB zipped with lazy load where applicable.

## Accessibility

- [ ] axe report clean — Acceptance: CI axe scan returns no critical issues for `/[locale]/` and `/[locale]/method/`.
- [ ] Keyboard and reduced-motion QA — Acceptance: Manual tab order and reduced-motion behaviour validated on latest staging build.

## SEO

- [ ] Canonicals/hreflang accurate — Acceptance: View source confirms locale canonicals, hreflang set, and dynamic sitemap enumerates locales.
- [ ] Preview suppression — Acceptance: `staging.louhen.app` responds with `X-Robots-Tag: noindex` and `robots.txt` → `Disallow: /`.

## Reliability

- [ ] Uptime workflow green — Acceptance: GitHub Action monitor passes for `/status` with correct bypass headers.
- [ ] Waitlist flows — Acceptance: Submit, confirm, and resend flows succeed with correct Firestore writes and TTL handling.

## Governance

- [ ] Decision log reviewed — Acceptance: `CONTEXT/decision_log.md` reflects any scope changes with Locked status, date, and owner.
- [ ] Artifacts uploaded — Acceptance: Playwright, Lighthouse, axe, SBOM, and CSP grep artifacts attached to release PR comment or Action summary.
- [ ] Release approvals — Acceptance: Required reviewers sign off with QA notes referencing this checklist.
