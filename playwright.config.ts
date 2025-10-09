import { Buffer } from 'node:buffer';
import { defineConfig, devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';

const FALLBACK_ORIGIN = 'http://localhost:4311';
const LOCALE_SEGMENT_PATTERN = /(\/en-de|\/de-de)$/;

function normalizeBase(value?: string | null) {
  return value?.trim().replace(/\/+$/, '') ?? '';
}

function ensureLocaleBase(value: string) {
  const normalized = normalizeBase(value) || FALLBACK_ORIGIN;
  if (LOCALE_SEGMENT_PATTERN.test(normalized)) {
    return normalized;
  }
  return `${normalized}/en-de`;
}

function withTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}

const isSandbox = process.env.SANDBOX_VALIDATION === '1';
const sandboxBaseURL = process.env.PREVIEW_BASE_URL;
const shouldSkipWebServer = process.env.PLAYWRIGHT_SKIP === '1';

const statusUser = process.env.STATUS_USER ?? process.env.CI_STATUS_USER ?? 'status-ops';
const statusPass = process.env.STATUS_PASS ?? process.env.CI_STATUS_PASS ?? 'status-secret';

<<<<<<< HEAD
const sandboxOrigin = normalizeBase(sandboxBaseURL);
if (isSandbox && !sandboxOrigin) {
  throw new Error('SANDBOX_VALIDATION=1 requires PREVIEW_BASE_URL to be set.');
}

const baseOverride = normalizeBase(process.env.BASE_URL);
const hasBaseOverride = baseOverride.length > 0;

const defaultOrigin = sandboxOrigin || normalizeBase(process.env.APP_BASE_URL) || FALLBACK_ORIGIN;
const targetOrigin = hasBaseOverride ? baseOverride : defaultOrigin;
const canonicalBaseURL = withTrailingSlash(ensureLocaleBase(targetOrigin));
const useExternalTarget = hasBaseOverride || isSandbox;

=======
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
const testEnv = {
  BASE_URL: targetOrigin,
  APP_BASE_URL: targetOrigin,
  TEST_MODE: '1',
  TEST_E2E_SHORTCIRCUIT: 'true',
  TEST_E2E_BYPASS_TOKEN: 'e2e-mocked-token',
  NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV ?? 'ci',
<<<<<<< HEAD
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? targetOrigin,
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? 'test_site_key',
  NEXT_PUBLIC_WAITLIST_URGENCY: process.env.NEXT_PUBLIC_WAITLIST_URGENCY ?? 'true',
  NEXT_PUBLIC_ANALYTICS_DISABLED: process.env.NEXT_PUBLIC_ANALYTICS_DISABLED ?? '1',
  NEXT_PUBLIC_ANALYTICS_DEBUG: process.env.NEXT_PUBLIC_ANALYTICS_DEBUG ?? '0',
  NEXT_PUBLIC_COMMIT_SHA: process.env.NEXT_PUBLIC_COMMIT_SHA ?? 'playwright-ci',
  NEXT_PUBLIC_LOCALES: process.env.NEXT_PUBLIC_LOCALES ?? 'en-de,de-de',
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en-de',
  DEFAULT_LOCALE: process.env.DEFAULT_LOCALE ?? 'en-de',
  NEXT_PUBLIC_METHOD_STICKY_CTA: process.env.NEXT_PUBLIC_METHOD_STICKY_CTA ?? 'true',
  NEXT_PUBLIC_METHOD_EXIT_NUDGE: process.env.NEXT_PUBLIC_METHOD_EXIT_NUDGE ?? 'true',
=======
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? baseURL,
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? 'test_site_key',
  NEXT_PUBLIC_WAITLIST_URGENCY: process.env.NEXT_PUBLIC_WAITLIST_URGENCY ?? 'true',
  NEXT_PUBLIC_ANALYTICS_DISABLED: process.env.NEXT_PUBLIC_ANALYTICS_DISABLED ?? '0',
  NEXT_PUBLIC_ANALYTICS_DEBUG: process.env.NEXT_PUBLIC_ANALYTICS_DEBUG ?? '1',
  NEXT_PUBLIC_COMMIT_SHA: process.env.NEXT_PUBLIC_COMMIT_SHA ?? 'playwright-ci',
  NEXT_PUBLIC_LOCALES: process.env.NEXT_PUBLIC_LOCALES ?? 'en,de',
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en',
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  HCAPTCHA_SECRET: process.env.HCAPTCHA_SECRET ?? 'test_secret',
  WAITLIST_CONFIRM_TTL_DAYS: process.env.WAITLIST_CONFIRM_TTL_DAYS ?? '7',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? 'ci-firebase',
  FIREBASE_DB_REGION: process.env.FIREBASE_DB_REGION ?? 'eur3',
  FIREBASE_ADMIN_SA_B64: process.env.FIREBASE_ADMIN_SA_B64 ?? Buffer.from('{"project_id":"ci-firebase"}').toString('base64'),
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? 'ci-resend-key',
  RESEND_FROM: process.env.RESEND_FROM ?? 'no-reply@ci.louhen.app',
  RESEND_REPLY_TO: process.env.RESEND_REPLY_TO ?? 'hello@ci.louhen.app',
<<<<<<< HEAD
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED ?? '1',
=======
  NODE_ENV: 'test',
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  SUPPRESSION_SALT: process.env.SUPPRESSION_SALT ?? 'test-salt',
  EMAIL_TRANSPORT: process.env.EMAIL_TRANSPORT ?? 'noop',
  STATUS_USER: statusUser,
  STATUS_PASS: statusPass,
} as const;

for (const [key, value] of Object.entries(testEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const httpCredentials = statusUser && statusPass ? { username: statusUser, password: statusPass } : undefined;

const config: PlaywrightTestConfig = {
  testDir: 'tests/e2e',
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['html'],
    ['json'],
  ],
  use: {
    baseURL: canonicalBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    httpCredentials,
  },
  projects: [],
  preserveOutput: 'never',
};

if (shouldSkipWebServer) {
  config.projects = [
    {
      name: 'chromium',
      testDir: 'tests/e2e',
      testMatch: /__skip__\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ];
} else {
  config.projects = [
    {
      name: 'chromium',
      testDir: 'tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'accessibility',
      testDir: 'tests/accessibility',
      use: { ...devices['Desktop Chrome'] },
    },
  ];

  if (!useExternalTarget) {
    config.webServer = {
      command: 'npm run start:test',
      url: canonicalBaseURL,
      reuseExistingServer: true,
      timeout: 180_000,
      env: {
        ...testEnv,
        BASE_URL: targetOrigin,
        APP_BASE_URL: targetOrigin,
        NEXT_PUBLIC_SITE_URL: targetOrigin,
        NODE_ENV: 'production',
      },
    };
  }
}

export default defineConfig(config);
