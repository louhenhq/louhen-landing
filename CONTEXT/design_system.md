# Design System — Web Tokens

## Web Tokens Usage
- **Source of truth**: Tokens live in `packages/design-tokens/` and must be regenerated with `npm run -w @louhen/design-tokens build` whenever design updates land. The build emits runtime CSS (`public/tokens/tokens*.css`) and compile-time JSON (`packages/design-tokens/build/web/tokens.json`) that the app consumes.
- **Runtime import**: `app/layout.tsx` imports `./styles/tokens.css`, which in turn pulls the light, dark, and high-contrast CSS bundles. Do *not* duplicate these imports in feature components or route files—tokens should be loaded exactly once at the root.
- **Compile-time mapping**: `tailwind.config.ts` maps Tailwind scales (colors, spacing, radii, typography, motion) to CSS variables generated from the token build. Any new semantic surface must be added to Tailwind’s `extend` section rather than hand-coded per component.
- **No raw styling escapes**: Components must not introduce raw `#hex`, `rgb()`, or `hsl()` values in TS/TSX, nor use arbitrary Tailwind utilities such as `bg-[<raw-hex>]`, `text-[rgb(...)]`, or `shadow-[...]`. Use semantic classnames (`bg-card`, `text-muted`, `shadow-card`) or documented token scales (`spacing`, `radii`, `letterSpacing`) instead. If a utility is missing, extend Tailwind with a token-backed entry rather than bypassing the system.

## Dark & High-Contrast Modes
- Theme switching relies on attributes applied to `<html>`: `data-theme="light|dark"` and `data-contrast="more"` as set by `ThemeInit` plus persisted cookies. Token CSS exports the necessary variants so switching values on the root attribute swaps palettes without re-importing styles.
- Components should rely on semantic utilities or CSS variables (e.g., `var(--semantic-color-bg-card)`) that automatically honor the current theme/contrast. Avoid toggling theme-specific classes manually—attribute changes and token variables already handle this.

## Guardrails & Follow-up Automation
- Policy (effective immediately): no raw color literals, no arbitrary Tailwind color/shadow utilities, and no duplicate token CSS imports. Prefer semantic helpers in `layout`, `buttons`, etc., and expand those helpers if a new pattern is required.
- Upcoming automation (future slices): ESLint rule to block raw color literals/arbitrary utilities; Tailwind plugin for token scale validation; CI check that `app/styles/tokens.css` remains the sole runtime import.
- Code review checklist: verify new components only use semantic utilities, confirm Tailwind `extend` handled any new token mapping, and ensure dark/high-contrast support remains attribute-driven.

## Do / Don’t Checklist
- ✅ **Do** use `className="bg-card text-muted"` or `style={{ color: 'var(--semantic-color-text-body)' }}` when semantic utilities are missing.
- ✅ **Do** extend `tailwind.config.ts` with a new token-backed entry when a scale is absent (e.g., `borderRadius.badge`).
- ✅ **Do** keep token CSS imports centralized in `app/layout.tsx` and adjust there if additional bundles are needed.
- ✅ **Do** verify new layout changes behave under `data-theme="dark"` and `data-contrast="more"` during QA.
- ❌ **Don’t** introduce `bg-[<raw-hex>]`, `text-[rgb(0,0,0)]`, or `shadow-[0_0_10px_rgba(...)]` utilities in components.
- ❌ **Don’t** import token CSS directly inside feature components or route modules.
- ❌ **Don’t** add theme toggles that swap CSS files or mutate `<link>` tags—use the existing attribute/variable approach.

## Token Remap Notes
- `color.status.success|warning|info|danger` → `color.feedback.success|warning|info|error` (email + future semantics share the feedback base scale).
- `color.neutral.paper` → `color.neutral.0` (email surface alias keeps neutral naming consistent with documentation).
- `color.brand.teal` → `color.brand.secondary` (legacy teal references now resolve to the secondary brand swatch).
- `color.light.surface|onSurface|outline|primary|onPrimary` → `color.background.surface`, `color.text.default`, `color.border.subtle`, `color.brand.primary`, `color.brand.onPrimary` respectively (email-light palette uses the same primitives as the main theme).
- `color.dark.surface|inverseSurface|onSurface|outline|primary|onPrimary` → `color.background.surfaceDark`, `color.background.raisedDark`, `color.text.inverse`, `color.border.strong`, `color.brand.muted`, `color.brand.primary` respectively (email-dark palette aligns to dark-mode primitives).

## Feature Components — Audit Round

| Component | Decision | Rationale | Required Tokens | Owner | Next Steps |
| --- | --- | --- | --- | --- | --- |
| `components/features/method/MethodHero.tsx` | New | Rebuilt hero with `components/ui` primitives, token-only styling, deterministic `data-testid`s, and refreshed analytics wiring; old layout relied on missing imports and non-token gradients. | `spacingAlias.md`, `spacingAlias.2xl`, `radii.2xl`, `radii.pill`, `color.brand.primary`, `semantic.color.bg.page`, `semantic.color.text.body`, `shadow.card` | Codex | 1. QA gradient fallback across supported browsers. 2. Regenerate screenshot baselines once visuals are approved. |
| `components/features/method/MethodTrustLayer.tsx` | Adjust | Replaced legacy helpers with the shared `Card` primitive, standardized badge/typography with tokens, and added deterministic selectors while preserving TrustSchema output. | `spacingAlias.sm`, `spacingAlias.2xl`, `radii.pill`, `color.border.subtle`, `semantic.color.bg.page`, `semantic.color.text.body` | Codex | 1. Confirm badge token variants cover upcoming seasonal palette needs. |
| `components/features/waitlist/ResendConfirmForm.tsx` | Adjust | Adopted `Card`, `Input`, and `Button` primitives, enforced tokenized spacing, and added deterministic selectors without disrupting analytics. | `spacingAlias.xs`, `spacingAlias.md`, `radii.2xl`, `semantic.color.bg.card`, `semantic.color.text.body`, `semantic.color.status.success`, `semantic.color.status.error`, `shadow.card` | Codex | 1. Exercise resend flow in staging to validate loading indicator and status messaging. |
