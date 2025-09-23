[![CI](https://github.com/Martin/louhen-landing/actions/workflows/ci.yml/badge.svg)](https://github.com/Martin/louhen-landing/actions/workflows/ci.yml)

See [BADGES.md](BADGES.md) for full project status and quality metrics.

# Louhen Landing

Louhen Landing is the official marketing site for Louhen, designed to provide a seamless user experience and showcase our brand. This project leverages modern web technologies to deliver fast, accessible, and maintainable content.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** CSS Modules, Style Dictionary for design tokens
- **Fonts:** Custom font optimization using `next/font`
- **State Management & Analytics:** Custom client-side analytics with consent management
- **Backend Integrations:** Firebase, Resend, hCaptcha for waitlist and user engagement

## Local Development

To get started locally:

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables as per `.env.example`, including:
   - `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`
   - `HCAPTCHA_SECRET`
   - `APP_BASE_URL`
   - `STATUS_USER`, `STATUS_PASS` (Basic Auth for the internal /status diagnostics)
   - `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`
   - `FIREBASE_ADMIN_SA_B64`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_DB_REGION`
   - `VERCEL_GIT_COMMIT_SHA` (provided by Vercel; set `COMMIT_SHA` manually if unavailable)
   - `WAITLIST_CONFIRM_TTL_DAYS` (optional)
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

> Tokens for design system are automatically built after install and before site builds.

## QA Targets

- Ensure waitlist form functions correctly with and without hCaptcha keys.
- Validate analytics events respect user consent and are dispatched properly.
- Confirm environment variables are correctly loaded and used.
- Verify design tokens are up to date and applied consistently.
- Test deployment pipelines and CI workflows for reliability.

## License

This project and its contents are proprietary and confidential. Unauthorized use, distribution, or reproduction is strictly prohibited. For licensing inquiries, please contact the Louhen team. See [NOTICE.md](NOTICE.md) for attributions of third-party dependencies and services used in this project.
