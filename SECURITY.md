# Security Policy — Louhen Landing

We take security and privacy seriously. If you believe you’ve found a vulnerability, please follow the steps below so we can fix it quickly and responsibly.

---

## ✅ How to Report

- **Preferred**: Open a *private* security advisory in GitHub (Security → Advisories → “Report a vulnerability”), or email us at **security@louhen.eu**.  
- Include: affected endpoint(s)/route(s), reproduction steps, impact, and any logs/screenshots.  
- Please **do not** open a public issue for security reports.

We will acknowledge within **72 hours** and provide a remediation ETA after initial triage.

---

## 🔍 Scope

This policy applies to this repository: **louhen-landing** (Next.js landing + waitlist).  
Primary assets in scope:
- API routes under `app/api/**/route.ts`
- Server-side integrations (Firebase Admin, hCaptcha verification, Resend)
- CI/CD workflows that could affect supply chain integrity

Out of scope (but welcome to flag privately if related):
- Third-party services (e.g., Resend, Google/Firebase, Vercel) — report to vendors as needed
- Social engineering, physical attacks, DDoS, or spam

---

## 🛡️ Reporting Guidance

- **PII**: Do not include live user PII in reports. Redact emails like `ma***@example.com`.  
- **Proof of concept**: Minimal, non-destructive PoC only. Do not run automated scanners against our production infrastructure.  
- **No data exfiltration**: Validate presence of a vulnerability without accessing data beyond your own test inputs.  
- **Rate limits**: If your testing might trigger rate limits or captchas, mention it in your report; don’t attempt to evade protections.

---

## 🧩 What We Care About (Examples)

- Server-side issues (RCE, SSRF, SQL/NoSQL injection, template injection)
- AuthZ/AuthN bypasses, IDORs, privilege escalation
- Secret leakage or misconfiguration (e.g., exposing `HCAPTCHA_SECRET`)
- Insecure headers/CSP that enable XSS/clickjacking
- Supply chain risks (malicious deps, workflow injection)
- Business logic bugs in waitlist confirm/resend flows
- Token/TTL validation bypasses (e.g., confirming expired tokens)

---

## 🚫 Not Considered Vulnerabilities

- Missing best-practice headers without a realistic exploit path
- Use of known TLS ciphers on trusted platforms we don’t control
- Rate limiting suggestions (unless enabling concrete abuse)
- Self-XSS requiring the user to paste code into their console

---

## 🔐 Our Commitments

- Triage within **72 hours**
- Clear communication and timely fixes
- Credit in release notes (optional; tell us if you want to remain anonymous)

---

## 🔄 Coordinated Disclosure

Please allow us a reasonable window to remediate before public disclosure. We’ll coordinate a timeline with you and aim to ship a fix quickly, then acknowledge your report.

---

## 📦 Dependencies & Secrets

- Secrets live only in environment config (Vercel). We do not accept secrets in PRs or issues.
- If you discover exposed secrets:
  1) Contact us privately immediately.
  2) Do not attempt to use the secret.
  3) We will rotate and invalidate credentials promptly.

---

## 🧭 References

- See `/CONTEXT/architecture.md` for routes, flows, and envs.
- See `/CONTEXT/coding_conventions.md` for security & privacy guidelines (GDPR-first).

Thank you for helping keep families safe online. 👟
