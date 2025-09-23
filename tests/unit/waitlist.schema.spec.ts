import { describe, it, expect } from 'vitest';
import { waitlistPayloadSchema } from '@/lib/waitlist/schema';

describe('waitlistPayloadSchema', () => {
  it('flags invalid email with path metadata', () => {
    const result = waitlistPayloadSchema.safeParse({
      email: 'not-an-email',
      locale: 'en',
      captchaToken: 'token',
      gdprConsent: true,
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const issuesJson = JSON.stringify(result.error.issues);
    expect(issuesJson).toMatch(/email/);
  });

  it('accepts valid payload', () => {
    const result = waitlistPayloadSchema.safeParse({
      email: 'user@example.com',
      locale: 'en',
      captchaToken: 'token',
      gdprConsent: true,
    });

    expect(result.success).toBe(true);
  });
});
