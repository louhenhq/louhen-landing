# Environment Variables

## Primary environments

| Environment | NEXT_PUBLIC_SITE_URL | NEXT_PUBLIC_ENV | WEB_ANALYTICS_DATASET | EMAIL_SUPPRESSION |
|-------------|----------------------|-----------------|-----------------------|-------------------|
| Production  | https://www.louhen.app | production       | louhen_web_prod        | _n/a_             |
| Preview     | https://staging.louhen.app | staging         | louhen_web_staging     | on                |

- Update production secrets in Vercel before launch; preview stays isolated to the staging branch.
- Any change to environment variables requires a redeploy to ensure functions and static prerenders pick up new values.

### Crawling toggle

- `NEXT_PUBLIC_ALLOW_INDEXING` — set to `true` on production once launch is approved. When unset/false or in non-production environments, `robots.txt` returns `Disallow: /` and omits the sitemap.

## Waitlist rate limiting

- `WAITLIST_RATE_SUBMITS_PER_HOUR_PER_IP` — soft cap for `/api/waitlist` submissions per IP per hour (defaults to `10` when unset or invalid).
- `WAITLIST_RATE_RESENDS_PER_30M_PER_EMAIL` — soft cap for `/api/waitlist/resend` per email per 30 minutes (defaults to `3`).

## CI secrets

- `VERCEL_AUTOMATION_BYPASS_SECRET` — used to send the `x-vercel-protection-bypass` header when Deployment Protection is active.

Keep sensitive values in Vercel-managed secrets only; never commit `.env` files with production data.
