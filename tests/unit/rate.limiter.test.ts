import { describe, expect, beforeAll, afterAll, beforeEach, test } from 'vitest';
import { enforceRateLimit, __testing } from '@/lib/rate/limiter';
import { getWaitlistResendRule, getWaitlistSubmitRule } from '@/lib/rate/rules';

describe('Rate limiter (memory mode)', () => {
  const originalTestMode = process.env.TEST_MODE;

  beforeAll(() => {
    process.env.TEST_MODE = '1';
  });

  afterAll(() => {
    if (originalTestMode === undefined) {
      delete process.env.TEST_MODE;
    } else {
      process.env.TEST_MODE = originalTestMode;
    }
  });

  beforeEach(() => {
    __testing.clearMemory();
  });

  test('allows the first submission within the limit', async () => {
    const rule = getWaitlistSubmitRule();
    const decision = await enforceRateLimit(rule, '203.0.113.1');
    expect(decision.allowed).toBe(true);
    expect(decision.remaining).toBe(rule.limit - 1);
  });

  test('blocks when the per-identifier limit is exceeded', async () => {
    const rule = { ...getWaitlistSubmitRule(), limit: 2 };
    const identifier = '198.51.100.7';

    const first = await enforceRateLimit(rule, identifier);
    expect(first.allowed).toBe(true);

    const second = await enforceRateLimit(rule, identifier);
    expect(second.allowed).toBe(true);

    const third = await enforceRateLimit(rule, identifier);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  test('memory keys never include raw email identifiers', async () => {
    const rule = getWaitlistResendRule();
    await enforceRateLimit(rule, 'privacy@example.com');
    const keys = __testing.getMemoryKeys();
    expect(keys.some((key) => key.includes('privacy@example.com'))).toBe(false);
  });
});
