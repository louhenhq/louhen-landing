import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { getExpiryDate, getTtlMs, getWaitlistConfirmTtlDays, WAITLIST_CONFIRM_TTL_DEFAULT_DAYS } from '@lib/waitlistConfirmTtl';

const ORIGINAL_TTL = process.env.WAITLIST_CONFIRM_TTL_DAYS;

beforeEach(() => {
  process.env.WAITLIST_CONFIRM_TTL_DAYS = ORIGINAL_TTL;
});

afterEach(() => {
  process.env.WAITLIST_CONFIRM_TTL_DAYS = ORIGINAL_TTL;
});

describe('waitlistConfirmTtl utilities', () => {
  it('returns default when env is unset', () => {
    delete process.env.WAITLIST_CONFIRM_TTL_DAYS;
    expect(getWaitlistConfirmTtlDays()).toBe(WAITLIST_CONFIRM_TTL_DEFAULT_DAYS);
  });

  it('parses positive integer from env', () => {
    process.env.WAITLIST_CONFIRM_TTL_DAYS = '3';
    expect(getWaitlistConfirmTtlDays()).toBe(3);
  });

  it('falls back to default for invalid values', () => {
    process.env.WAITLIST_CONFIRM_TTL_DAYS = 'abc';
    expect(getWaitlistConfirmTtlDays()).toBe(WAITLIST_CONFIRM_TTL_DEFAULT_DAYS);

    process.env.WAITLIST_CONFIRM_TTL_DAYS = '-5';
    expect(getWaitlistConfirmTtlDays()).toBe(WAITLIST_CONFIRM_TTL_DEFAULT_DAYS);
  });

  it('computes ttl in milliseconds', () => {
    process.env.WAITLIST_CONFIRM_TTL_DAYS = '2';
    expect(getTtlMs()).toBe(2 * 24 * 60 * 60 * 1000);
  });

  it('computes expiry date offset from now', () => {
    process.env.WAITLIST_CONFIRM_TTL_DAYS = '1';
    const before = Date.now() + 24 * 60 * 60 * 1000 - 1000;
    const after = Date.now() + 24 * 60 * 60 * 1000 + 1000;
    const expiresAt = getExpiryDate();
    expect(expiresAt.getTime()).toBeGreaterThan(before);
    expect(expiresAt.getTime()).toBeLessThan(after);
  });

  it('respects explicit days override', () => {
    const ttl = getTtlMs(5);
    expect(ttl).toBe(5 * 24 * 60 * 60 * 1000);
  });
});
