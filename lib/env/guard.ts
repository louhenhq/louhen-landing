const WAITLIST_PUBLIC_ENV_PREFIX = '[env:waitlist:public]';
const WAITLIST_SERVER_ENV_PREFIX = '[env:waitlist:server]';

type RuntimePhase = 'production' | 'preview' | 'development' | 'test';

type RuntimeSnapshot = {
  phase: RuntimePhase;
  isProduction: boolean;
  isPreview: boolean;
  isDevelopment: boolean;
  isTest: boolean;
};

type WaitlistPublicEnvSummary = {
  runtime: RuntimeSnapshot;
  captcha: {
    hasSiteKey: boolean;
  };
  waitlist: {
    urgencyFlagSet: boolean;
  };
  missingInProduction: string[];
};

type WaitlistServerEnvSummary = WaitlistPublicEnvSummary & {
  firebase: {
    hasServiceAccount: boolean;
    hasProjectId: boolean;
    hasRegion: boolean;
  };
  resend: {
    hasApiKey: boolean;
    hasFrom: boolean;
    hasReplyTo: boolean;
    configured: boolean;
  };
  captcha: WaitlistPublicEnvSummary['captcha'] & {
    hasSecret: boolean;
    configured: boolean;
  };
  waitlist: WaitlistPublicEnvSummary['waitlist'] & {
    ttlValid: boolean;
  };
};

function resolveRuntime(): RuntimeSnapshot {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  const nextPublicEnv = process.env.NEXT_PUBLIC_ENV?.trim().toLowerCase();
  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  const isExplicitTest = nodeEnv === 'test' || process.env.TEST_MODE === '1';

  if (isExplicitTest) {
    return { phase: 'test', isProduction: false, isPreview: false, isDevelopment: false, isTest: true };
  }

  if (vercelEnv === 'production' || nextPublicEnv === 'production') {
    return { phase: 'production', isProduction: true, isPreview: false, isDevelopment: false, isTest: false };
  }

  if (vercelEnv === 'preview' || nextPublicEnv === 'staging') {
    return { phase: 'preview', isProduction: false, isPreview: true, isDevelopment: false, isTest: false };
  }

  if (vercelEnv === 'development') {
    return { phase: 'development', isProduction: false, isPreview: false, isDevelopment: true, isTest: false };
  }

  if (nodeEnv === 'production') {
    return { phase: 'production', isProduction: true, isPreview: false, isDevelopment: false, isTest: false };
  }

  return { phase: 'development', isProduction: false, isPreview: false, isDevelopment: true, isTest: false };
}

function hasEnv(key: string): boolean {
  const value = process.env[key];
  return typeof value === 'string' && value.trim().length > 0;
}

function parsePositiveInteger(value: string | undefined): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (trimmed === '') return true;
  if (!/^\d+$/.test(trimmed)) return false;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isSafeInteger(parsed) && parsed > 0;
}

function appendUnique(target: string[], value: string) {
  if (!target.includes(value)) {
    target.push(value);
  }
}

function assertProductionReady(prefix: string, runtime: RuntimeSnapshot, missing: string[]) {
  if (!runtime.isProduction || missing.length === 0) {
    return;
  }
  const formatted = missing.join(', ');
  throw new Error(`${prefix} Missing required environment variables: ${formatted}`);
}

function emitWarnings(prefix: string, runtime: RuntimeSnapshot, warnings: string[]) {
  if (runtime.isTest || warnings.length === 0) {
    return;
  }
  for (const warning of warnings) {
    console.warn(`${prefix} ${warning}`);
  }
}

let cachedPublicSummary: WaitlistPublicEnvSummary | null = null;
let cachedServerSummary: WaitlistServerEnvSummary | null = null;

export function ensureWaitlistPublicEnv(): WaitlistPublicEnvSummary {
  if (cachedPublicSummary) {
    return cachedPublicSummary;
  }

  const runtime = resolveRuntime();
  const missingInProduction: string[] = [];
  const warnings: string[] = [];

  const hasCaptchaSite = hasEnv('NEXT_PUBLIC_HCAPTCHA_SITE_KEY');
  if (!hasCaptchaSite) {
    appendUnique(missingInProduction, 'NEXT_PUBLIC_HCAPTCHA_SITE_KEY');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('NEXT_PUBLIC_HCAPTCHA_SITE_KEY missing; captcha will fail locally.');
    }
  }

  const hasUrgencyFlag = hasEnv('NEXT_PUBLIC_WAITLIST_URGENCY');
  if (!hasUrgencyFlag) {
    appendUnique(missingInProduction, 'NEXT_PUBLIC_WAITLIST_URGENCY');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('NEXT_PUBLIC_WAITLIST_URGENCY missing; defaulting to enabled locally.');
    }
  }

  assertProductionReady(WAITLIST_PUBLIC_ENV_PREFIX, runtime, missingInProduction);
  emitWarnings(WAITLIST_PUBLIC_ENV_PREFIX, runtime, warnings);

  const summary: WaitlistPublicEnvSummary = {
    runtime,
    captcha: {
      hasSiteKey: hasCaptchaSite,
    },
    waitlist: {
      urgencyFlagSet: hasUrgencyFlag,
    },
    missingInProduction,
  };

  cachedPublicSummary = summary;
  return summary;
}

export function ensureWaitlistServerEnv(): WaitlistServerEnvSummary {
  if (cachedServerSummary) {
    return cachedServerSummary;
  }

  const publicSummary = ensureWaitlistPublicEnv();
  const runtime = publicSummary.runtime;
  const missingInProduction = [...publicSummary.missingInProduction];
  const warnings: string[] = [];

  const hasServiceAccount = hasEnv('FIREBASE_ADMIN_SA_B64') || hasEnv('FIREBASE_SERVICE_ACCOUNT');
  const hasProjectId = hasEnv('FIREBASE_PROJECT_ID');
  const hasRegion = hasEnv('FIREBASE_DB_REGION');

  if (!hasServiceAccount) {
    appendUnique(missingInProduction, 'FIREBASE_ADMIN_SA_B64 (or FIREBASE_SERVICE_ACCOUNT)');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('Firebase Admin credentials missing; Firestore writes will fail.');
    }
  }
  if (!hasProjectId) {
    appendUnique(missingInProduction, 'FIREBASE_PROJECT_ID');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('FIREBASE_PROJECT_ID missing; Firestore not configured.');
    }
  }
  if (!hasRegion) {
    appendUnique(missingInProduction, 'FIREBASE_DB_REGION');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('FIREBASE_DB_REGION missing; Firestore region defaults may be incorrect.');
    }
  }

  const hasResendApiKey = hasEnv('RESEND_API_KEY');
  const hasResendFrom = hasEnv('RESEND_FROM');
  const hasResendReplyTo = hasEnv('RESEND_REPLY_TO');

  if (!hasResendApiKey) {
    appendUnique(missingInProduction, 'RESEND_API_KEY');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('RESEND_API_KEY missing; emails will run in noop sandbox mode.');
    }
  }
  if (!hasResendFrom) {
    appendUnique(missingInProduction, 'RESEND_FROM');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('RESEND_FROM missing; emails cannot set From address.');
    }
  }
  if (!hasResendReplyTo) {
    appendUnique(missingInProduction, 'RESEND_REPLY_TO');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('RESEND_REPLY_TO missing; Reply-To will fall back to support defaults.');
    }
  }

  const hasCaptchaSecret = hasEnv('HCAPTCHA_SECRET');
  if (!hasCaptchaSecret) {
    appendUnique(missingInProduction, 'HCAPTCHA_SECRET');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('HCAPTCHA_SECRET missing; captcha verification disabled.');
    }
  }

  const ttlRaw = process.env.WAITLIST_CONFIRM_TTL_DAYS;
  const ttlValid = parsePositiveInteger(ttlRaw);
  if (!ttlValid) {
    appendUnique(missingInProduction, 'WAITLIST_CONFIRM_TTL_DAYS (must be a positive integer)');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('WAITLIST_CONFIRM_TTL_DAYS invalid; defaulting to 7 days locally.');
    }
  }

<<<<<<< HEAD
  if (!parsePositiveInteger(process.env.WAITLIST_RATE_SUBMITS_PER_HOUR_PER_IP)) {
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('WAITLIST_RATE_SUBMITS_PER_HOUR_PER_IP invalid; defaulting to 10 submissions/hour.');
    }
  }

  if (!parsePositiveInteger(process.env.WAITLIST_RATE_RESENDS_PER_30M_PER_EMAIL)) {
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('WAITLIST_RATE_RESENDS_PER_30M_PER_EMAIL invalid; defaulting to 3 resends/30m.');
    }
  }

=======
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  assertProductionReady(WAITLIST_SERVER_ENV_PREFIX, runtime, missingInProduction);
  emitWarnings(WAITLIST_SERVER_ENV_PREFIX, runtime, warnings);

  const summary: WaitlistServerEnvSummary = {
    runtime,
    firebase: {
      hasServiceAccount,
      hasProjectId,
      hasRegion,
    },
    resend: {
      hasApiKey: hasResendApiKey,
      hasFrom: hasResendFrom,
      hasReplyTo: hasResendReplyTo,
      configured: hasResendApiKey && hasResendFrom,
    },
    captcha: {
      hasSiteKey: publicSummary.captcha.hasSiteKey,
      hasSecret: hasCaptchaSecret,
      configured: publicSummary.captcha.hasSiteKey && hasCaptchaSecret,
    },
    waitlist: {
      urgencyFlagSet: publicSummary.waitlist.urgencyFlagSet,
      ttlValid,
    },
    missingInProduction,
  };

  cachedServerSummary = summary;
  return summary;
}

export type { WaitlistPublicEnvSummary, WaitlistServerEnvSummary };
