const ONE_HOUR_MS = 60 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export type RateLimitScope = 'ip' | 'email';

export type RateLimitRule = {
  name: string;
  scope: RateLimitScope;
  limit: number;
  windowMs: number;
};

export const DEFAULT_WAITLIST_SUBMITS_PER_HOUR_PER_IP = 10;
export const DEFAULT_WAITLIST_RESENDS_PER_30M_PER_EMAIL = 3;

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return fallback;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function getWaitlistSubmitRule(): RateLimitRule {
  const limit = parsePositiveInteger(process.env.WAITLIST_RATE_SUBMITS_PER_HOUR_PER_IP, DEFAULT_WAITLIST_SUBMITS_PER_HOUR_PER_IP);
  return {
    name: 'waitlist_submit_ip',
    scope: 'ip',
    limit,
    windowMs: ONE_HOUR_MS,
  };
}

export function getWaitlistResendRule(): RateLimitRule {
  const limit = parsePositiveInteger(process.env.WAITLIST_RATE_RESENDS_PER_30M_PER_EMAIL, DEFAULT_WAITLIST_RESENDS_PER_30M_PER_EMAIL);
  return {
    name: 'waitlist_resend_email',
    scope: 'email',
    limit,
    windowMs: THIRTY_MINUTES_MS,
  };
}
