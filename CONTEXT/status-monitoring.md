# /api/status Protection & Monitoring

Runbook for securing and validating the operational diagnostics endpoint.

## Endpoint Contract
- Returns JSON with the following keys:
  - `noncePresent`: boolean — whether a CSP nonce is present.
  - `emailTransport`: boolean — true when Resend credentials are wired and active.
  - `suppressionsCount`: number or null — recent suppression sample size.
  - `env`: string or object — environment metadata (e.g., Vercel env, commit SHA).
- Responses must be `Cache-Control: no-store` and `X-Robots-Tag: noindex`.

## Protection
- HTTP Basic Auth enforced via `STATUS_USER` and `STATUS_PASS`.
- Local development may use simple defaults (see `.env.example`).
- Preview and production require strong, randomly generated secrets managed in Vercel and GitHub Secrets.
- Never share credentials outside the release/ops group; rotate on suspicion of leak.

## GitHub Action Monitor
- Workflow file: `.github/workflows/status-check.yml`.
- Triggers hourly (`cron: 0 * * * *`) and via `workflow_dispatch`.
- Matrix runs against `preview` (`https://staging.louhen.app/api/status`) and `production` (`https://www.louhen.app/api/status`).
- Uses repository secrets:
  - `STATUS_USER_PREVIEW`, `STATUS_PASS_PREVIEW`
  - `STATUS_USER_PROD`, `STATUS_PASS_PROD`
- `curl` performs Basic Auth; `jq` validates `noncePresent`, `emailTransport`, and the shape of `env`.
- Workflow fails on 401 responses or schema drift; alerts appear in GitHub Actions.

## Manual Verification
```bash
# Preview
curl -u "$STATUS_USER:$STATUS_PASS" https://staging.louhen.app/api/status

# Production
curl -u "$STATUS_USER:$STATUS_PASS" https://www.louhen.app/api/status
```
- Expect HTTP 200 with the contract above.
- `emailTransport=false` is normal in environments without Resend credentials.
- Always target `https://www.louhen.app`; the apex `https://louhen.app` is a permanent redirect and is not monitored directly.

## Rotation Procedure
1. Generate new strong passwords for `STATUS_USER` and `STATUS_PASS` (preview and production independently).
2. Update Vercel environment variables; trigger redeploys for staging/production.
3. Update GitHub repository secrets (`STATUS_USER_PREVIEW`, etc.).
4. Manually run the **Status Endpoint Monitor** workflow to confirm success.
5. Archive old credentials securely; never reuse retired values.
