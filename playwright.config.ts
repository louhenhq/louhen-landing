import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:4311';
const resolvedPort = (() => {
  try {
    const { port, protocol } = new URL(baseURL);
    if (port) return Number.parseInt(port, 10);
    return protocol === 'https:' ? 443 : 80;
  } catch {
    return 4311;
  }
})();

const testEnv = {
  APP_BASE_URL: baseURL,
  TEST_E2E_SHORTCIRCUIT: 'true',
  TEST_E2E_BYPASS_TOKEN: 'e2e-mocked-token',
  HCAPTCHA_SECRET: 'sk_dummy_for_e2e',
  NODE_ENV: 'test',
  SUPPRESSION_SALT: process.env.SUPPRESSION_SALT ?? 'test-salt',
  STATUS_USER: process.env.STATUS_USER ?? 'ops-status',
  STATUS_PASS: process.env.STATUS_PASS ?? 'status-secret',
} as const;

for (const [key, value] of Object.entries(testEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

export default defineConfig({
  testDir: 'tests/e2e',
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  preserveOutput: 'never',
  webServer: {
    command: `npm run start -- --port ${resolvedPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: testEnv,
  },
});
