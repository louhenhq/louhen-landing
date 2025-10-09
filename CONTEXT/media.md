# Media & Open Graph (OG) Policy

This slice hardens Louhen’s social preview and media delivery pipeline. Follow these rules when adding or reviewing OG/Twitter metadata, social assets, or dynamic image builders.

## Canonical OG Spec
- Required tags: `og:title`, `og:description`, `og:url`, `og:image`, `og:locale`, and `twitter:card=summary_large_image`. Prefer populating `twitter:image` with the same asset.
- All URLs must be absolute, pointing at the canonical host (`https://www.louhen.app`) or preview origin when running remotely. Never ship relative paths.
- OG images are 1200×630 px (1.91:1 aspect ratio), ≤2 MB. Prefer PNG or WebP; fall back to PNG if WebP can’t satisfy the size budget.
- Metadata builders must compute localized titles/descriptions via translations and append `?locale=<bcp47>` to dynamic OG URLs so crawlers receive the correct locale snapshot.

## Dynamic OG Route Requirements
- The dynamic renderer (`app/opengraph-image/route.ts`) validates incoming params (`locale`, `slug`/`ref` etc.) before rendering.
- Responses include headers:
  - `Cache-Control: public, max-age=300, s-maxage=86400`
  - `Content-Type: image/png` (or `image/webp` when the renderer outputs WebP)
- The route must always return `200` with an image. On validation/render failures, serve the locale’s static fallback instead of erroring or redirecting.
- Never issue 3xx responses for crawlers. Treat 500s as bugs.

## Static Fallbacks
- Store static images in `public/og/<locale>/<key>.png`. Keep them updated alongside translations.
- When dynamic rendering is disabled or fails validation, metadata must fall back to these static assets.

## Raster & Delivery Policy
- Prefer AVIF/WebP for site imagery via `next/image`. Keep PNG fallbacks for OG and email contexts.
- Keep the allowed external domains list minimal in `next.config.ts/images`.
- Document new large media (≥1 MB) in PRs with optimisation notes.

## Testing Expectations
- Automated tests fetch OG image URLs from rendered pages, asserting:
  - Absolute URL with locale query param
  - HTTP 200 without redirect hops
  - `Content-Type` beginning with `image/`
  - `Content-Length` below the 2 MB budget
- Quarantined tests must cover the static fallback path when dynamic OG is feature-flagged off.

