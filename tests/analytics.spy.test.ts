import { describe, expect, it, beforeEach, vi } from 'vitest';
import { track } from '@/lib/clientAnalytics';

describe('analytics track helper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn(async () => ({ ok: true })) as any;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('consent:v1', JSON.stringify({ analytics: true, marketing: false }));
    }
  });

  it('sends payloads with selfReferralSuspect flag', async () => {
    await track({ name: 'wl_submit', status: 'ok', selfReferralSuspect: true } as any);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
    expect(body.selfReferralSuspect).toBe(true);
  });

  it('supports wl_referral_applied event payloads', async () => {
    await track({ name: 'wl_referral_applied', ref: 'CODE123' });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
    expect(body.name).toBe('wl_referral_applied');
    expect(body.ref).toBe('CODE123');
  });
});
