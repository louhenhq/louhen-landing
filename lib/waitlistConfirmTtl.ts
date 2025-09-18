const DEFAULT_TTL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseTtlDays(raw: string | undefined): number {
  if (!raw) return DEFAULT_TTL_DAYS;
  const trimmed = raw.trim();
  if (trimmed === '') return DEFAULT_TTL_DAYS;
  if (!/^-?\d+$/.test(trimmed)) return DEFAULT_TTL_DAYS;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return DEFAULT_TTL_DAYS;
  return parsed;
}

export function getWaitlistConfirmTtlDays(): number {
  return parseTtlDays(process.env.WAITLIST_CONFIRM_TTL_DAYS);
}

export function getWaitlistConfirmTtlMs(): number {
  return getWaitlistConfirmTtlDays() * MS_PER_DAY;
}

export { DEFAULT_TTL_DAYS as WAITLIST_CONFIRM_TTL_DEFAULT_DAYS };
