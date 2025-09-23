import { test } from '@playwright/test';

test('playwright suite skipped via PLAYWRIGHT_SKIP', () => {
  test.skip(process.env.PLAYWRIGHT_SKIP !== '1', 'PLAYWRIGHT_SKIP not set to 1');
});
