# Landing v1 — Design Implementation

Epic owner: Marketing Engineering. Reference spec: [`design_system.md`](design_system.md).

## Slice Index

- **Slice 0 — Decision lock & guardrails** *(Done 2025-10-01)*  
  Acceptance criteria:  
  - Decision log captures locked design principles and Fraunces/Inter typography swap.  
  - `CONTEXT/design_system.md` published as canonical reference.  
  - README, PR checklist, and backlog updated with design guardrails.  
  Links: [`decision_log.md`](decision_log.md#louhen-landing--design-system-locked-2025-10-01), [`design_system.md`](design_system.md), [PR template](../.github/pull_request_template.md).

- **Slice 1 — Token inventory & cleanup** *(Planned)*  
  Acceptance criteria:  
  - Audit existing Style Dictionary tokens; remove unused values and map to semantic names.  
  - Document token coverage across light/dark in [`design_system.md#3-color-tokens`](design_system.md#3-color-tokens).  
  - Add automated lint preventing raw color, radius, or shadow literals.  
  Links: [`design_system.md#3-color-tokens`](design_system.md#3-color-tokens), [`design_system.md#5-components`](design_system.md#5-components).

- **Slice 2 — Typography & token wiring** *(Planned)*  
  Acceptance criteria:  
  - Fraunces + Inter wired via `next/font` with preload + swap strategy per [`design_system.md#2-typography`](design_system.md#2-typography).  
  - Type utility classes generated (clamp sizes, line-height, letter-spacing).  
  - Waitlist and hero surfaces refactored to use utilities only.  
  Links: [`design_system.md#2-typography`](design_system.md#2-typography), [`design_system.md#7-accessibility`](design_system.md#7-accessibility).

- **Slice 3 — Color tokens & dark theme baseline** *(Planned)*  
  Acceptance criteria:  
  - Semantic color tokens implemented for light mode, mirrored in dark mode.  
  - Global CSS variables and Style Dictionary sync verified; no raw hex remaining.  
  - Snapshot visual regression for light/dark hero sections.  
  Links: [`design_system.md#3-color-tokens`](design_system.md#3-color-tokens), [`design_system.md#9-dark-mode`](design_system.md#9-dark-mode).

- **Slice 4 — Layout grid & spacing rhythm** *(Planned)*  
  Acceptance criteria:  
  - Implement 12-column responsive grid with max width 1440px per [`design_system.md#4-layout`](design_system.md#4-layout).  
  - Replace ad-hoc spacing with shared scale tokens.  
  - Document responsive behavior in Storybook or MDX reference.  
  Links: [`design_system.md#4-layout`](design_system.md#4-layout), [`design_system.md#1-core-principles`](design_system.md#1-core-principles).

- **Slice 5 — Buttons & action surfaces** *(Planned)*  
  Acceptance criteria:  
  - Build primary/secondary/tertiary button variants honoring `rounded-2xl` and focus tokens.  
  - Wire analytics attributes and motion micro-interactions per [`design_system.md#5-components`](design_system.md#5-components) and [`design_system.md#6-motion`](design_system.md#6-motion).  
  - Add Playwright + aXe coverage for focus-visible and accessibility targets.  
  Links: [`design_system.md#5-components`](design_system.md#5-components), [`design_system.md#6-motion`](design_system.md#6-motion).

- **Slice 6 — Forms & inputs polish** *(Planned)*  
  Acceptance criteria:  
  - Refactor inputs/textarea to shared component with tokenized states.  
  - Validate error/help text semantics and contrast.  
  - Add reduced-motion handling for inline validation.  
  Links: [`design_system.md#5-components`](design_system.md#5-components), [`design_system.md#7-accessibility`](design_system.md#7-accessibility).

- **Slice 7 — Card system & content modules** *(Planned)*  
  Acceptance criteria:  
  - Establish card primitives (surface, shadow, padding) per [`design_system.md#5-components`](design_system.md#5-components).  
  - Port testimonial, timeline, and feature highlight blocks to shared card API.  
  - Snapshot diff to ensure consistent micro-interactions.  
  Links: [`design_system.md#5-components`](design_system.md#5-components), [`design_system.md#10-content--trust-microcopy`](design_system.md#10-content--trust-microcopy).

- **Slice 8 — Motion & hero experiences** *(Planned)*  
  Acceptance criteria:  
  - Implement Framer Motion presets and staging hooks per [`design_system.md#6-motion`](design_system.md#6-motion).  
  - Compress hero Lottie to ≤ 250KB zipped with static fallback.  
  - Add reduced-motion bypass and automated audit step.  
  Links: [`design_system.md#6-motion`](design_system.md#6-motion), [`design_system.md#1-core-principles`](design_system.md#1-core-principles).

- **Slice 9 — Accessibility hardening** *(Planned)*  
  Acceptance criteria:  
  - Reach Lighthouse A11y 100 and aXe zero critical issues baseline.  
  - Ensure focus-visible rings across all interactive elements.  
  - Document QA checklist updates in [`design_system.md#7-accessibility`](design_system.md#7-accessibility).  
  Links: [`design_system.md#7-accessibility`](design_system.md#7-accessibility), [PR template](../.github/pull_request_template.md).

- **Slice 10 — Internationalization readiness** *(Planned)*  
  Acceptance criteria:  
  - Audit hero/section copy for DE length compliance; add layout fallbacks.  
  - Ensure RTL mirroring via logical properties where needed.  
  - Update translation notes in `messages/**`.  
  Links: [`design_system.md#8-internationalization`](design_system.md#8-internationalization), [`design_system.md#10-content--trust-microcopy`](design_system.md#10-content--trust-microcopy).

- **Slice 11 — Dark mode ship & toggle** *(Planned)*  
  Acceptance criteria:  
  - Implement system-detected dark mode with toggle persistence per [`design_system.md#9-dark-mode`](design_system.md#9-dark-mode).  
  - Verify contrast and imagery adjustments in dark theme.  
  - Add Playwright visual diff for dark mode hero/CTA.  
  Links: [`design_system.md#9-dark-mode`](design_system.md#9-dark-mode), [`design_system.md#3-color-tokens`](design_system.md#3-color-tokens).

- **Slice 12 — Content & trust microcopy rollout** *(Planned)*  
  Acceptance criteria:  
  - Align hero, CTA, and footer copy with trust guidelines.  
  - Add GDPR reassurance messaging to forms and confirmation flows.  
  - Localization team sign-off on tone + translations.  
  Links: [`design_system.md#10-content--trust-microcopy`](design_system.md#10-content--trust-microcopy), [`design_system.md#1-core-principles`](design_system.md#1-core-principles).

- **Slice 13 — Imagery & illustration system** *(Planned)*  
  Acceptance criteria:  
  - Refresh hero/section imagery per style rules; document asset sourcing.  
  - Update illustration library with consistent stroke weights and pastel palette.  
  - Add governance note for future image swaps.  
  Links: [`design_system.md#11-imagery--illustration-style`](design_system.md#11-imagery--illustration-style), [`design_system.md#12-governance`](design_system.md#12-governance).
