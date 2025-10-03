import { type APIRequestContext } from '@playwright/test';
import { DEFAULT_LOCALE } from '@/lib/i18n/locales';

export type SeedWaitlistResult = {
  email: string;
  token: string;
  docId: string;
  lookupHash: string;
};

export async function seedWaitlistUser(request: APIRequestContext, email: string): Promise<SeedWaitlistResult> {
  const response = await request.post('/api/waitlist', {
    data: {
      email,
      consent: true,
      hcaptchaToken: 'e2e-mocked-token',
      locale: DEFAULT_LOCALE.value,
    },
    headers: { 'content-type': 'application/json' },
  });

  if (!response.ok()) {
    throw new Error(`Failed to seed waitlist user: ${response.status()}`);
  }

  const payload = await response.json();
  if (!payload?.token || !payload?.docId) {
    throw new Error('Seed response missing token/docId');
  }

  return {
    email,
    token: payload.token as string,
    docId: payload.docId as string,
    lookupHash: payload.lookupHash as string,
  };
}

export async function markTokenExpired(request: APIRequestContext, token: string) {
  const response = await request.post('/api/testing/waitlist', {
    data: {
      action: 'expire_token',
      token,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to expire token: ${response.status()}`);
  }

  const payload = await response.json().catch(() => ({}));
  if (!payload?.ok) {
    throw new Error('Expire token action returned non-ok response');
  }
}
