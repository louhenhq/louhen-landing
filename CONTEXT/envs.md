# Environment Matrix — Louhen Landing

Canonical reference for configuration across local, preview, and production environments. Update this table via PR whenever variables change.

---

## Core Variables (Locked)

| Variable                  | Local (`.env.local`)    | Preview (`staging.louhen.app`) | Production (`www.louhen.app`) | Owner  | Rotation               | Notes                                                             |
| ------------------------- | ----------------------- | ------------------------------ | ----------------------------- | ------ | ---------------------- | ----------------------------------------------------------------- |
| **APP_BASE_URL**          | `http://localhost:3000` | `https://staging.louhen.app`   | `https://www.louhen.app`      | Martin | Quarterly or on signal | Must mirror deployment origin.                                    |
| **FEATURE_PREVIEW_STRIP** | `false`                 | `true`                         | `false`                       | Martin | Quarterly or on signal | Preview flag hides consent, disables analytics, enforces noindex. |
| **RESEND_API_KEY**        | Dev key (optional)      | Preview key                    | Production key                | Martin | Quarterly or on signal | Rotate via Resend; disable preview sends when not QAing email.    |
| **RESEND_FROM**           | `no-reply@louhen.app`   | `no-reply@louhen.app`          | `no-reply@louhen.app`         | Martin | Quarterly or on signal | Aligns with locked transactional identity.                        |
| **RESEND_REPLY_TO**       | `hello@louhen.app`      | `hello@louhen.app`             | `hello@louhen.app`            | Martin | Quarterly or on signal | Human support channel; keep consistent.                           |

Status: (Locked) — Last updated: 2025-10-09, Owner: Martin

## Extended Variables

| Variable                          | Local                   | Preview                      | Production                 | Owner  | Rotation               | Notes                                    |
| --------------------------------- | ----------------------- | ---------------------------- | -------------------------- | ------ | ---------------------- | ---------------------------------------- |
| **FIREBASE_ADMIN_SA_B64**         | Dev service account     | Preview service account      | Production service account | Martin | Quarterly or on signal | Store only in Vercel/GitHub secrets.     |
| **FIREBASE_PROJECT_ID**           | `louhen-dev`            | `louhen-staging`             | `louhen-prod`              | Martin | Quarterly or on signal | Must match Firestore instance per env.   |
| **FIREBASE_DB_REGION**            | `eur3`                  | `eur3`                       | `eur3`                     | Martin | Quarterly or on signal | Region locked; migration requires plan.  |
| **NEXT_PUBLIC_HCAPTCHA_SITE_KEY** | Universal test key      | Staging key                  | Production key             | Martin | Quarterly or on signal | Never ship test key beyond local.        |
| **HCAPTCHA_SECRET**               | Test secret             | Staging secret               | Production secret          | Martin | Quarterly or on signal | Server-only; rotate on signal.           |
| **WAITLIST_CONFIRM_TTL_DAYS**     | `7`                     | `1`                          | `7`                        | Martin | Quarterly or on signal | Short TTL on preview for expiry QA.      |
| **NEXT_PUBLIC_SITE_URL**          | `http://localhost:3000` | `https://staging.louhen.app` | `https://www.louhen.app`   | Martin | Quarterly or on signal | Mirrors `APP_BASE_URL`.                  |
| **STATUS_USER**                   | Dev credential          | Strong random secret         | Strong random secret       | Martin | Quarterly or on signal | Required for `/status` and uptime check. |
| **STATUS_PASS**                   | Dev credential          | Strong random secret         | Strong random secret       | Martin | Quarterly or on signal | Rotate alongside `STATUS_USER`.          |

## Operational Notes

- Update Vercel and GitHub secrets before redeploying when rotations occur; never commit `.env` with production data.
- CI uses sanitized values—ensure preview envs mirror required `NEXT_PUBLIC_*` variables so builds succeed without server secrets.
- Any variable change requires a redeploy for serverless functions and static prerenders to pick up the update.
- `FEATURE_PREVIEW_STRIP=true` enforces stripped previews: no analytics payloads, consent UI hidden, and `noindex` headers guaranteed.
