import { describe, expect, it, beforeEach, vi } from 'vitest';
import { applyReferralFromURL, getAppliedRef, isRecentApplication } from '@/app/(site)/_lib/referral';

function setCookie(key: string, value: string) {
  document.cookie = `${key}=${value}; Path=/; Max-Age=31536000`;
}

describe('referral helper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset cookies
    document.cookie.split(';').forEach((cookie) => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
    // Reset sessionStorage
    sessionStorage.clear();
  });

  it('returns null when no referral applied', () => {
    expect(getAppliedRef()).toBeNull();
    expect(isRecentApplication()).toBe(false);
  });

  it('stores referral and applied timestamp', () => {
    const params = new URLSearchParams({ ref: 'TEST123' });
    const applied = applyReferralFromURL(params);
    expect(applied).toBe(true);
    expect(getAppliedRef()).toBe('TEST123');
    expect(isRecentApplication()).toBe(true);
  });

  it('treats old application as not recent', () => {
    setCookie('wl_ref', 'TESTOLD');
    setCookie('wl_ref_applied_at', String(Date.now() - 2 * 86_400_000));
    expect(getAppliedRef()).toBe('TESTOLD');
    expect(isRecentApplication()).toBe(false);
  });

  it('is idempotent per session', () => {
    const params = new URLSearchParams({ ref: 'DUPLICATE' });
    const first = applyReferralFromURL(params);
    const second = applyReferralFromURL(params);
    expect(first).toBe(true);
    expect(second).toBe(false);
  });
});
