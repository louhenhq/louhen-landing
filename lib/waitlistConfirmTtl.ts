const DEFAULT_TTL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDays(raw: string | undefined | null): number {
  if (!raw) return DEFAULT_TTL_DAYS;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return DEFAULT_TTL_DAYS;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return DEFAULT_TTL_DAYS;
  }
  return parsed;
}

export function getWaitlistConfirmTtlDays(): number {
  return parseDays(process.env.WAITLIST_CONFIRM_TTL_DAYS);
}

export function getTtlMs(days?: number): number {
  const effectiveDays = Number.isFinite(days) && (days as number) > 0 ? (days as number) : getWaitlistConfirmTtlDays();
  return effectiveDays * MS_PER_DAY;
}

export function getExpiryDate(days?: number): Date {
  const expiresInMs = getTtlMs(days);
  return new Date(Date.now() + expiresInMs);
}

export function getWaitlistConfirmTtlMs(): number {
  return getTtlMs();
}

export { DEFAULT_TTL_DAYS as WAITLIST_CONFIRM_TTL_DEFAULT_DAYS };
