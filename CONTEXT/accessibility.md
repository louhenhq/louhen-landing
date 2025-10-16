# Accessibility — Header & Global Controls

Reference checklist for implementing and testing the landing header. Augments the repo-wide conventions in `coding_conventions.md` and the automated axe coverage in `CONTEXT/testing.md`.

---

## Skip Links & Landmarks
- The header renders a localized `header.skipLink` anchor as its first focusable element. It targets `#main-content`, so every page-level `<main>` must use `id="main-content"`.
- Header wrapper uses `<header role="banner">`; navigation areas use `<nav aria-label="Primary navigation">` (desktop) and `<nav aria-label="Mobile navigation">` (drawer).
- Footer retains `<footer role="contentinfo">` to give assistive tech predictable regions.
- Skip link styling relies on design tokens (rounded pill, focus-visible reveal). Routes that do not include the marketing header must provide their own skip link.

---

## Focus Management
- Mobile drawer and promo ribbon both trap focus while open. Store the trigger element and restore focus on close.
- Drawer closes with `Esc`, overlay click, or CTA activation. When closing because of CTA scroll, move focus to the first form control in `#waitlist-form` after scroll completes.
- Consent badge opens the consent manager (banner modal); ensure focus jumps into the manager and returns to the badge when dismissed.
- Header drawer handles `Esc` + backdrop clicks, manages its own focus trap, and returns focus to `[data-nav-drawer-trigger]` on close (unless the action intentionally shifts focus, e.g., CTA scroll or consent manager launch).
- Scroll-triggered motion keeps the header visible while any child element (skip link, nav, CTA, controls, drawer trigger) has focus or while the drawer is open, preventing disappearing focus targets during keyboard navigation.
- Drawer focus trap must be active: initial focus lands on the dialog heading, `Tab`/`Shift+Tab` cycle within the drawer, `Esc` and backdrop click close the drawer, and focus returns to `[data-nav-drawer-trigger]` unless the close action explicitly moves focus elsewhere (e.g., CTA scroll, locale change, consent modal).

---

## Keyboard & Pointer Targets
- All header controls (locale select, theme toggle, CTA, hamburger) maintain ≥44×44px interactive area.
- Primary navigation links render as `inline-flex` pills (`h-11`, `px-md`) so top-level anchors meet the 44×44px target without relying on surrounding padding; logout pills reuse the secondary button token set.
- Provide `aria-expanded`, `aria-controls`, and `aria-haspopup` on the hamburger button and consent badge as appropriate.
- Locale options list uses native `<select>` for accessibility parity. Announce languages via localized text.
- When the header shrinks, do not collapse text-only buttons into icon-only unless `aria-label` and tooltip remain.
- Mobile drawer trigger exposes `data-nav-drawer-trigger` with the translated text label from `header.drawer.open`; keep this structure so automated tests can assert visibility.
- Theme toggle mirrors the locale switcher structure: visible label on mobile, SR-only label on desktop, and localized option text for each mode (`header.theme.modes.*`). Maintain keyboard focus order after the locale switcher.
- CTA button remains a real `<button>` for scroll behaviour and `<a>` for link behaviour; ensure both variants include `data-testid` hooks (`lh-nav-cta-primary`, `lh-nav-cta-primary-mobile`) and accessible names from translations.
- Promo ribbon dismiss control uses a visible text label (no icon-only) and keeps focus within the ribbon when tabbing; reserving height avoids unexpected scroll jumps for keyboard users.

---

## Color & Contrast
- Use design tokens with semantic names (`--semantic-color-*`). Minimum contrast:
  - Text vs background ≥ 4.5:1 on body copy.
  - CTA buttons vs background ≥ 3:1 (WCAG AA for large text).
- Transparent variant must overlay an accessible gradient/backdrop so text remains legible on hero imagery. Verify with dark and light hero variants.
- Focus states use `outline-offset` ≥ 2px and a tokenized focus color (`--semantic-color-focus-ring`).

---

## Motion & Reduced Motion
- Shrink/expand animations respect `prefers-reduced-motion: reduce`; fall back to instant state change.
- Drawer slide uses CSS transitions that disable when reduced motion is set.
- Hide/reveal motion uses `translateY` only; `data-motion="disabled"` snaps the header in place whenever the user prefers reduced motion.
- Drawer transitions rely on `translateX` + opacity only; when `data-motion="disabled"`, the sheet snaps into place without animation and still honours focus expectations.

---

## Testing Checklist
- Axe scans (desktop + mobile) show zero serious/critical issues.
- Keyboard tab cycle: skip link → brand → nav → controls → CTA → drawer toggle (mobile).
- Screen reader announcement verifies `aria-current="page"` on relevant nav items when implemented.
- Manual contrast check using tooling (axe, Chrome DevTools) on transparent and solid header states.
- Verify focus trapping/dismissal for drawer, consent manager, and promo ribbon.

Keep this file updated as new header variants or controls ship.
