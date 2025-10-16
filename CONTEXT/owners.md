# Test & Component Owners

Use this map when triaging failures or planning new coverage. Tag the owning squad in PRs/issues when their surface regresses.

| Area / Component | Primary Routes / Features | Owning Squad | Slack / Contact |
| --- | --- | --- | --- |
| App shell & layout | `app/layout.tsx`, global providers, page-ready sentinel | Core Platform | #louhen-platform |
| Header & nav (desktop/mobile) | `components/features/header-nav/**` | Web Experience | #louhen-web |
| Footer & legal surfaces | `components/features/footer/**`, `/[locale]/legal/*` | Legal & Compliance | #louhen-legal |
| Waitlist funnel | `/[locale]/waitlist`, `/api/waitlist/*`, pre-onboarding flows | Growth | #louhen-growth |
| Method experience | `/[locale]/method`, method hero/trust/testimonials | Product Experience | #louhen-product |
| SEO / JSON-LD / Metadata | `lib/shared/seo/json-ld.tsx`, metadata builders, sitemap | SEO & Platform | #louhen-seo |
| Security headers & CSP | Middleware, security policy config, Playwright header specs | Security Engineering | #louhen-security |
| Consent & analytics | Consent provider, banner, analytics bootstrap | Privacy & Analytics | #louhen-privacy |

Update this table when ownership changes and reference it from failure triage tickets.
