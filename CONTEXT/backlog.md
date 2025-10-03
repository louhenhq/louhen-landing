# Landing v1 — Design Implementation

Epic owner: Marketing Engineering. Reference spec: [`design_system.md`](design_system.md).

## Slice Index

### Completed (Landing v1)

- **Slice 0 — Decision lock & guardrails** *(Done 2025-10-01)*  
  Design principles, typography swap, and governance docs published. PR checklist + README updated with guardrails.

- **Slice 1 — Token inventory & cleanup** *(Done 2025-10-02)*  
  Semantic tokens shipped; raw hex/radius/shadow lint now enforced and documented.

- **Slice 2 — Typography & token wiring** *(Done 2025-10-03)*  
  Fraunces/Inter wired via `next/font`, type utilities added, and hero/waitlist sections migrated.

- **Slice 3 — Color tokens & dark theme baseline** *(Done 2025-10-03)*  
  Light/dark semantic palettes live with shared variables; legacy classes routed through tokens.

- **Slice 4 — Layout grid & spacing rhythm** *(Done 2025-10-04)*  
  SiteShell + 12-col grid in production; spacing scale replaces ad-hoc margins.

- **Slice 5 — Buttons & action surfaces** *(Done 2025-10-05)*  
  Button primitives and focus rings unified; analytics hooks and motion presets integrated.

- **Slice 6 — Forms & inputs polish** *(Done 2025-10-06)*  
  Waitlist inputs share tokenized states; error/help semantics + reduced-motion handling verified.

- **Slice 7 — Card system & content modules** *(Done 2025-10-06)*  
  Card primitives adopted across testimonials, timeline, and trust tiles.

- **Slice 8 — Motion & hero experiences** *(Done 2025-10-07)*  
  Framer Motion presets applied; hero transitions respect reduced-motion; Lottie size budget documented.

- **Slice 9 — Accessibility hardening** *(Done 2025-10-08)*  
  Lighthouse A11y 100 baseline, aXe zero critical issues, and focus-visible audit complete.

- **Slice 10 — Internationalization readiness** *(Done 2025-10-09)*  
  BCP-47 routing, locale switcher, hreflang/canonical helpers, and sitemap/robots governance shipped.

- **Slice 11 — Performance & accessibility pass** *(Done 2025-10-09)*  
  Reduced-motion defaults added, CLS/LCP protections in place, README and PR checklist updated with perf budgets.

- **Slice 12 — Content & trust microcopy rollout** *(Done 2025-10-09)*  
  Trust messaging centralized under `trustCopy.*`; hero, waitlist, confirmation, and footer aligned with GDPR/LouhenFit tone.

- **Slice 13 — Final Sweep & Freeze** *(Done 2025-10-10)*  
  Visual baselines captured for key sections, validate:local enforces Playwright/aXe/Lighthouse gates, and Landing v1 milestone locked.

### Future backlog

- **Admin/dashboard primitives migration** — Port admin surfaces to shared Button/Input/Card primitives and retire legacy utilities.
- **Seasonal/brand theming** — Document process for seasonal accent swaps and imagery refreshes while respecting freeze governance.
- **Illustration & asset library** — Expand pastel illustration set with consistent stroke weights; align sourcing/licensing notes.

## Follow-ups
- **Admin/dashboard primitives migration** *(New)*  
  Migrate remaining admin/dashboard surfaces to the shared Button/Input/Card primitives (legacy `buttons.*`/inline controls still present). Track parity with landing slice before enabling guardrails to block legacy utilities in non-marketing code.
