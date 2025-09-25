# SEO Playbook

## Pre-launch policy

- Set `X-Robots-Tag: noindex` and serve `robots.txt` with `Disallow: /` on both preview and production domains until launch.
- Keep sitemap disabled pre-launch to prevent accidental discovery.
- Canonical URLs in metadata must still point to `https://www.louhen.app` even while `noindex` is active.

## Launch day checklist

- Remove the `noindex` directives and update `robots.txt` to allow crawling with `Sitemap: https://www.louhen.app/sitemap.xml`.
- Revalidate caches/CDN entries after toggling crawl settings.
- Ensure every `<link rel="canonical">`, `hreflang`, and `x-default` entry resolves to `https://www.louhen.app/{locale}`; never reference the apex domain.

## Redirects

- Enforce a permanent `301` redirect from `louhen.app` (apex) to `https://www.louhen.app` to keep a single canonical host and avoid duplicate indexing.
- Preview host remains `https://staging.louhen.app`; keep it isolated with `noindex` until GA.
