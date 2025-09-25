# SEO Playbook

## Pre-launch policy

- Set `X-Robots-Tag: noindex` and serve `robots.txt` with `Disallow: /` on both preview and production domains until launch.
- Keep sitemap disabled pre-launch to prevent accidental discovery.

## Launch day checklist

- Remove the `noindex` directives and update `robots.txt` to allow crawling with `Sitemap: https://www.louhen.app/sitemap.xml`.
- Revalidate caches/CDN entries after toggling crawl settings.

## Redirects

- Enforce a permanent `301` redirect from `louhen.app` (apex) to `https://www.louhen.app` to keep a single canonical host and avoid duplicate indexing.
