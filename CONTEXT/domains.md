# Domains & DNS

## Cloudflare records

- `staging.louhen.app` — CNAME → `cname.vercel-dns.com` (DNS only)
- `*.staging.louhen.app` — CNAME → `cname.vercel-dns.com` (DNS only)
- `louhen.app` — A → `76.76.21.21` (DNS only, disabled pre-launch)
- `www.louhen.app` — CNAME → `cname.vercel-dns.com` (DNS only, disabled pre-launch)

## Deployment phases

### Pre-launch

| Host | Record | Target | Status |
|------|--------|--------|--------|
| staging.louhen.app | CNAME | cname.vercel-dns.com | Active |
| *.staging.louhen.app | CNAME | cname.vercel-dns.com | Active |
| louhen.app | A | 76.76.21.21 | Disabled |
| www.louhen.app | CNAME | cname.vercel-dns.com | Disabled |

### Launch

| Host | Record | Target | Status |
|------|--------|--------|--------|
| staging.louhen.app | CNAME | cname.vercel-dns.com | Active (protected) |
| *.staging.louhen.app | CNAME | cname.vercel-dns.com | Active (protected) |
| louhen.app | A | 76.76.21.21 | Enabled |
| www.louhen.app | CNAME | cname.vercel-dns.com | Enabled |

Keep staging endpoints behind Deployment Protection and require authentication headers for automated checks.
