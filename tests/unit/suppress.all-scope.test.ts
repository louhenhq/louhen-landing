import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { shouldSend, upsertSuppression } from '@/lib/email/suppress';

const email = `wildcard-all-${Date.now()}@example.com`;
const originalTestMode = process.env.TEST_MODE;

beforeEach(() => {
  process.env.TEST_MODE = '1';
});

afterEach(() => {
  if (originalTestMode === undefined) {
    delete process.env.TEST_MODE;
  } else {
    process.env.TEST_MODE = originalTestMode;
  }
});

describe('suppress all wildcard', () => {
  it('"all" scope blocks every other scope', async () => {
    await upsertSuppression({ email, scope: 'all' });

    const transactional = await shouldSend({ email, scope: 'transactional' });
    expect(transactional.allowed).toBe(false);

    const marketing = await shouldSend({ email, scope: 'marketing' });
    expect(marketing.allowed).toBe(false);
  });
});
