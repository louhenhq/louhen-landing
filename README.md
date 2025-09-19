This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Design Tokens (web + Flutter)

This repo uses **Style Dictionary** to build brand tokens for both the landing site (CSS variables) and the Flutter app (Dart).

- Source: `packages/design-tokens/tokens/`
- Build outputs:
  - Web: `packages/design-tokens/build/web/tokens.css` (imported by `app/globals.css`)
  - Flutter: `packages/design-tokens/build/flutter/tokens.g.dart` (copy into the app repo)

### Commands
- Build tokens only:
  `npm run -w @louhen/design-tokens build`
- Site build (runs tokens build automatically via `prebuild`):
  `npm run build`

> Tokens also build automatically after `npm install` via `postinstall`.

## Waitlist

The marketing waitlist relies on Firebase, Resend, and hCaptcha. Configure these environment variables (server-side unless noted):

- `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` (client) and `HCAPTCHA_SECRET`
- `APP_BASE_URL` – e.g. `https://louhen.com`
- `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO`
- `FIREBASE_ADMIN_SA_B64` (base64 encoded service account JSON)
- `FIREBASE_PROJECT_ID`, `FIREBASE_DB_REGION`
- `WAITLIST_CONFIRM_TTL_DAYS` (optional override for confirmation expiration)

Local development notes:

- The waitlist form renders without hCaptcha if `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` is missing and shows a non-blocking warning banner. Submissions will still require a valid site key + secret to succeed against the API.
- After confirmation, users are redirected to `/waitlist/success` (with optional `status` query) and expired links redirect to `/waitlist/expired`.
- Run `npm run test:unit -- tests/waitlist.api.test.ts` for API coverage and `npm run test:unit -- __tests__/waitlist.form.test.tsx` for the client form behaviour.
