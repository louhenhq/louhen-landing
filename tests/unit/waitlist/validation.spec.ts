import { describe, expect, it } from 'vitest';
import { BadRequestError } from '@/lib/http/errors';
import { parsePreOnboardingDTO, parseResendDTO, parseSignupDTO } from '@lib/shared/validation/waitlist-schema';

describe('waitlist validation DTOs', () => {
  it('parses signup payload', () => {
    const dto = parseSignupDTO({
      email: 'user@example.com',
      consent: true,
      hcaptchaToken: 'token',
      locale: 'en',
      utm: { source: 'ads' },
      ref: 'invite',
    });
    expect(dto.email).toBe('user@example.com');
    expect(dto.consent).toBe(true);
    expect(dto.locale).toBe('en');
  });

  it('rejects signup payload without consent', () => {
    expect(() =>
      parseSignupDTO({
        email: 'user@example.com',
        consent: false,
        hcaptchaToken: 'token',
      })
    ).toThrow(BadRequestError);
  });

  it('parses resend payload', () => {
    const dto = parseResendDTO({ email: 'user@example.com', hcaptchaToken: 'token' });
    expect(dto.email).toBe('user@example.com');
  });

  it('rejects resend payload without email', () => {
    expect(() => parseResendDTO({ hcaptchaToken: 'token' })).toThrow(BadRequestError);
  });

  it('parses pre-onboarding payload', () => {
    const dto = parsePreOnboardingDTO({
      parentFirstName: 'Alex',
      children: [
        {
          name: 'Sam',
          birthday: '2020-01-01',
          weight: 18,
          shoeSize: '25 EU',
        },
      ],
    });
    expect(dto.parentFirstName).toBe('Alex');
    expect(dto.children?.[0]?.name).toBe('Sam');
  });
});
