# Performance Budget — Header

Defines the performance guardrails for the marketing header. Treat these numbers as ceilings; flag in PR if a change approaches the limit.

---

## Budgets
- **JavaScript:** ≤ 12 KB gzip dedicated to header interactions (locale switcher, drawer, consent badge). Reuse existing utilities before adding new bundles.
- **CSS:** ≤ 4 KB gzip of critical styles for header + ribbon. Leverage Tailwind utilities and design tokens to piggyback on shared styles.
- **Runtime work:** Header hydration must complete < 50 ms on mid-tier devices (Moto G Power class). Avoid heavy `scroll` listeners; prefer intersection observers.
- **CLS:** Header + ribbon changes must keep cumulative layout shift < 0.02 during initial load and < 0.05 during interactions.

---

## Loading Strategies
- Mark header scripts `use client` only where stateful logic is required. Extract pure helpers into server modules.
- Use lazy imports for optional modules (e.g., analytics capture, animation helpers) triggered by user actions such as opening the drawer.
- Set `prefetch={false}` on nav anchors that do not leave the current page. Allow Next.js to prefetch only routes with real navigation.
- Header navigation, drawer, and CTA links disable automatic Next.js prefetch and instead call `router.prefetch` on pointer/focus via `useIntentPrefetch`; QA can assert this policy through `data-prefetch-policy="intent"` attributes.
- Respect `Priority Hints`: avoid `fetchPriority="high"` on header images/icons unless essential; rely on inline SVG where possible.
- `ThemeInit` injects a nonce-aware inline script that reads persisted theme/contrast preferences (cookie/localStorage) and sets `data-theme`/`data-contrast` before paint. Keep this script tiny (< 1 KB) and update when persistence keys change to avoid flashes.
- Persist theme choice in cookies so SSR renders with the correct palette and avoids CLS when toggling between Light/Dark.
- Promo ribbon reserves `min-h` space even when dismissed so layout doesn’t jump. Dismissal hides content but keeps the reserved slot; document any adjustments when ribbon height changes.

---

## Measurement & Tooling
- Track bundle size with `npm run analyze` (Webpack/Next analyzer) before merging large header changes.
- Playwright + Lighthouse CI already run in GitHub Actions; compare the CLS and TBT metrics when header code changes. Document any regression >5% in PR description.
- `tests/e2e/header.regressions.spec.ts` asserts CTA width parity between guest and hinted states so reserved button width continues to keep CLS at ~0.
- Add custom `performance.mark('header-ready')` after header hydration if instrumentation needed; wire to analytics only after consent.

---

## Operational Notes
- Promo ribbons must reserve vertical space via CSS to avoid layout jank. When dismissable, animate using `height` → `0` with `overflow: hidden` and set `prefers-reduced-motion` fallback to instant removal.
- Skip link reveals absolutely over the header (`focus-visible:absolute ...`) so focus never pushes layout when the link becomes visible.
- Ribbon dismissal returns focus after the placeholder is rendered (via `requestAnimationFrame`) so we avoid forced reflow spikes while keeping keyboard users oriented.
- Header motion relies on a single passive `scroll` listener that defers work to `requestAnimationFrame`; keep any future state updates inside that batch and continue clearing `will-change` once the header returns to the default state.
- Mobile drawer transitions are transform/opacity only; keep `data-motion="disabled"` in sync with reduced-motion preferences and release the `overflow: hidden` scroll lock as soon as the drawer unmounts.
- The `/tokens` playground runs on-demand rendering (no SSG) so engineers can inspect tokens after toggling cookies; keep the component lightweight (no remote fetches) and avoid introducing per-request computation beyond simple maps.
- When integrating third-party scripts (discouraged), route them through server-side proxies and ensure they respect CSP nonces. Document the impact here before shipping.
- Test mobile-first: throttle network to `Fast 3G` and CPU 4× slow-down in Chrome DevTools; header interactions must remain responsive.

Update the numbers when the broader performance budget changes or new header capabilities launch.
