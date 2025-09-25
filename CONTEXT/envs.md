# Environment Variables

## Primary environments

| Environment | NEXT_PUBLIC_SITE_URL | NEXT_PUBLIC_ENV | WEB_ANALYTICS_DATASET | EMAIL_SUPPRESSION |
|-------------|----------------------|-----------------|-----------------------|-------------------|
| Production  | https://www.louhen.app | production       | louhen_web_prod        | _n/a_             |
| Preview     | https://staging.louhen.app | staging         | louhen_web_staging     | on                |

- Update production secrets in Vercel before launch; preview stays isolated to the staging branch.
- Any change to environment variables requires a redeploy to ensure functions and static prerenders pick up new values.

## CI secrets

- `VERCEL_AUTOMATION_BYPASS_SECRET` — used to send the `x-vercel-protection-bypass` header when Deployment Protection is active.

Keep sensitive values in Vercel-managed secrets only; never commit `.env` files with production data.
