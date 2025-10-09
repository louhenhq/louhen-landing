# Media Performance Notes

Use this cheat sheet when reviewing performance for OG and other raster assets.

## OG Endpoint Caching
- Dynamic OG route (`/opengraph-image`) must serve with `Cache-Control: public, max-age=300, s-maxage=86400`.
- Edge/CDN caches can extend beyond 24 h, but browsers should revalidate after 5 minutes to pick up localized copy changes.
- Static fallbacks under `public/og/**` inherit standard asset caching; ensure any CDN configs respect the same 1-day TTL.

## Asset Budgets
- OG images: 1200×630 px, ≤2 MB after compression. PNG/WebP preferred; keep PNG for email compatibility.
- Inline preview assets (hero, cards) should prioritise AVIF/WebP via `next/image` with PNG fallbacks only when necessary.
- Document optimisations in PRs when adding media >1 MB.

## Delivery Defaults
- `next/image` must advertise `formats: ['image/avif', 'image/webp']` and restrict `remotePatterns`/`domains` to essentials only.
- When adding new OG variants, reuse shared helpers to avoid duplicate fetch/render logic and keep cache headers consistent.
