import { defineConfig, devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:4311';
const shouldSkipWebServer = process.env.PLAYWRIGHT_SKIP === '1';

const testEnv = {
  BASE_URL: baseURL,
  APP_BASE_URL: baseURL,
  TEST_MODE: '1',
  TEST_E2E_SHORTCIRCUIT: 'true',
  TEST_E2E_BYPASS_TOKEN: 'e2e-mocked-token',
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? 'test_site_key',
  HCAPTCHA_SECRET: process.env.HCAPTCHA_SECRET ?? 'test_secret',
  NODE_ENV: 'test',
  SUPPRESSION_SALT: process.env.SUPPRESSION_SALT ?? 'test-salt',
  EMAIL_TRANSPORT: process.env.EMAIL_TRANSPORT ?? 'noop',
  STATUS_USER: process.env.STATUS_USER ?? 'status-ops',
  STATUS_PASS: process.env.STATUS_PASS ?? 'status-secret',
} as const;

for (const [key, value] of Object.entries(testEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const config: PlaywrightTestConfig = {
  testDir: 'tests/e2e',
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [],
  preserveOutput: 'never',
};

if (shouldSkipWebServer) {
  config.projects = [
    {
      name: 'chromium',
      testMatch: /__skip__\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ];
} else {
  config.projects = [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ];
  config.webServer = {
    command: 'next start -H 127.0.0.1 -p 4311',
    url: 'http://127.0.0.1:4311',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...testEnv,
    },
  };
}

export default defineConfig(config);
