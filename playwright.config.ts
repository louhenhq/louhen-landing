import type { PlaywrightTestConfig } from '@playwright/test';
import { Buffer } from 'node:buffer';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const HOST = process.env.HOST ?? '127.0.0.1';
const parsedPort = Number.parseInt(process.env.PORT ?? '4311', 10);
const PORT = Number.isFinite(parsedPort) ? parsedPort : 4311;
const HEALTH_PATH = process.env.PW_HEALTH_PATH ?? '/icon.svg';
const fallbackLocalURL = `http://127.0.0.1:${PORT}`;
const shouldSkipWebServer = process.env.PLAYWRIGHT_SKIP === '1';
const artifactsRoot = process.env.PLAYWRIGHT_ARTIFACTS_DIR ?? 'artifacts/playwright';
const playwrightResultsDir = path.join(artifactsRoot, 'results');
const FALLBACK_ORIGIN = fallbackLocalURL;
const sandboxBaseURL = process.env.PREVIEW_BASE_URL ?? '';
const isSandbox = process.env.SANDBOX_VALIDATION === '1';
function normalizeBase(raw?: string | null): string {
  if (!raw) return '';
  return raw.trim().replace(/\/+$/, '');
}

function withTrailingSlash(value: string): string {
  if (!value) return value;
  return value.endsWith('/') ? value : `${value}/`;
}

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '0.0.0.0', '::1', '[::1]']);

function isLoopbackOrigin(value: string): boolean {
  try {
    const parsed = new URL(value);
    return LOOPBACK_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

mkdirSync(playwrightResultsDir, { recursive: true });

const statusUser = process.env.STATUS_USER ?? process.env.CI_STATUS_USER ?? 'status-ops';
const statusPass = process.env.STATUS_PASS ?? process.env.CI_STATUS_PASS ?? 'status-secret';

const headerEnv = process.env.PROTECTION_HEADER;
const extraHTTPHeaders = headerEnv
  ? Object.fromEntries(
      headerEnv
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const index = line.indexOf(':');
          if (index === -1) throw new Error(`Invalid PROTECTION_HEADER entry: ${line}`);
          const key = line.slice(0, index).trim();
          const value = line.slice(index + 1).trim();
          return [key, value];
        })
    )
  : undefined;

const cookieEnv = process.env.PROTECTION_COOKIE;
const storageStatePath = cookieEnv ? '.playwright/auth-storage.json' : undefined;

const sandboxOrigin = normalizeBase(sandboxBaseURL);
if (isSandbox && !sandboxOrigin) {
  throw new Error('SANDBOX_VALIDATION=1 requires PREVIEW_BASE_URL to be set.');
}

const baseOverride = normalizeBase(process.env.BASE_URL);
const hasBaseOverride = baseOverride.length > 0;

const defaultOrigin = isSandbox ? sandboxOrigin : FALLBACK_ORIGIN;
const targetOrigin = hasBaseOverride ? baseOverride : defaultOrigin;
const baseTestURL = withTrailingSlash(targetOrigin);
const resolvedBaseURL = targetOrigin;

// Keep test env flags explicit so local + CI runs share the same prelaunch gating.
const testEnv = {
  BASE_URL: targetOrigin,
  APP_BASE_URL: targetOrigin,
  TEST_MODE: '1',
  TEST_E2E_SHORTCIRCUIT: 'true',
  IS_PRELAUNCH: process.env.IS_PRELAUNCH ?? 'true',
  TEST_E2E_BYPASS_TOKEN: 'e2e-mocked-token',
  NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV ?? 'ci',
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? resolvedBaseURL,
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? 'test_site_key',
  NEXT_PUBLIC_WAITLIST_URGENCY: process.env.NEXT_PUBLIC_WAITLIST_URGENCY ?? 'true',
  NEXT_PUBLIC_BANNER_WAITLIST_URGENCY: process.env.NEXT_PUBLIC_BANNER_WAITLIST_URGENCY ?? 'true',
  NEXT_PUBLIC_ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED ?? '0',
  NEXT_PUBLIC_ANALYTICS_DISABLED: process.env.NEXT_PUBLIC_ANALYTICS_DISABLED ?? '0',
  NEXT_PUBLIC_ANALYTICS_DEBUG: process.env.NEXT_PUBLIC_ANALYTICS_DEBUG ?? '1',
  NEXT_PUBLIC_COMMIT_SHA: process.env.NEXT_PUBLIC_COMMIT_SHA ?? 'playwright-ci',
  HCAPTCHA_SECRET: process.env.HCAPTCHA_SECRET ?? 'test_secret',
  WAITLIST_CONFIRM_TTL_DAYS: process.env.WAITLIST_CONFIRM_TTL_DAYS ?? '7',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? 'ci-firebase',
  FIREBASE_DB_REGION: process.env.FIREBASE_DB_REGION ?? 'eur3',
  FIREBASE_ADMIN_SA_B64: process.env.FIREBASE_ADMIN_SA_B64 ?? Buffer.from('{"project_id":"ci-firebase"}').toString('base64'),
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? 'ci-resend-key',
  RESEND_FROM: process.env.RESEND_FROM ?? 'no-reply@ci.louhen.app',
  RESEND_REPLY_TO: process.env.RESEND_REPLY_TO ?? 'hello@ci.louhen.app',
  NODE_ENV: 'production',
  HOST,
  PORT: String(PORT),
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

const loggedEnv = {
  baseURL: baseTestURL,
  IS_PRELAUNCH: process.env.IS_PRELAUNCH,
  CSP_REPORT_ONLY: process.env.CSP_REPORT_ONLY ?? process.env.NEXT_PUBLIC_CSP_REPORT_ONLY ?? '0',
  DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'de-de',
  ANALYTICS_ENABLED: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED ?? '0',
};
console.info('[playwright:env]', JSON.stringify(loggedEnv, null, 2));

const httpCredentials = statusUser && statusPass ? { username: statusUser, password: statusPass } : undefined;

console.info('[playwright:env]', JSON.stringify(loggedEnv));

const config: PlaywrightTestConfig = {
  testDir: 'tests',
  testIgnore: ['unit/**'],
  timeout: process.env.CI ? 90_000 : 60_000,
  retries: 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ['html', { outputFolder: path.join(artifactsRoot, 'html'), open: 'never' }],
    ['json', { outputFile: path.join(artifactsRoot, 'report.json') }],
  ],
  outputDir: playwrightResultsDir,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: baseTestURL,
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
    httpCredentials,
    extraHTTPHeaders,
    storageState: storageStatePath,
  },
  projects: [],
  preserveOutput: 'never',
  globalSetup: 'tests/setup/auth.setup.ts',
};

const shouldStartWebServer = !shouldSkipWebServer && isLoopbackOrigin(targetOrigin);

if (shouldSkipWebServer) {
  config.projects = [
    {
      name: 'desktop-chromium',
      testMatch: ['**/__skip__.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
  ];
} else {
  config.projects = [
    {
      name: 'desktop-chromium',
      testMatch: ['e2e/**/*.e2e.ts', 'e2e/**/*.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      testMatch: ['e2e/**/*.e2e.ts', 'e2e/**/*.spec.ts'],
      use: { ...devices['Pixel 5'] },
      grep: /@mobile/,
      grepInvert: /@desktop-only/,
    },
    {
      name: 'axe',
      testMatch: ['axe/**/*.axe.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
  ];
  if (shouldStartWebServer) {
    config.webServer = {
      command: 'npm run start:test',
      url: `${fallbackLocalURL}${HEALTH_PATH}`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        ...testEnv,
      },
    };
  }
}

export default defineConfig(config);
