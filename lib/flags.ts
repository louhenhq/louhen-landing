import { ensureWaitlistPublicEnv } from '@/lib/env/guard';

const waitlistEnv = ensureWaitlistPublicEnv();

function parseBooleanFlag(raw: string | null | undefined): boolean | null {
  if (raw === undefined || raw === null) return null;
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false;
  return null;
}

function defaultForRuntime(): boolean {
  if (waitlistEnv.runtime.isProduction) {
    return false;
  }
  return true;
}

const resolvedUrgencyFlag = (() => {
  const parsed = parseBooleanFlag(process.env.NEXT_PUBLIC_WAITLIST_URGENCY);
  if (parsed !== null) {
    return parsed;
  }
  return defaultForRuntime();
})();

export const WAITLIST_URGENCY_COPY_ENABLED = resolvedUrgencyFlag;
