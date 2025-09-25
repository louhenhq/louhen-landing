const WAITLIST_ENV_PREFIX = '[env:waitlist]';

type RuntimePhase = 'production' | 'preview' | 'development' | 'test';

type RuntimeSnapshot = {
  phase: RuntimePhase;
  isProduction: boolean;
  isPreview: boolean;
  isDevelopment: boolean;
  isTest: boolean;
};

type WaitlistEnvSummary = {
  runtime: RuntimeSnapshot;
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
  captcha: {
    hasSiteKey: boolean;
    hasSecret: boolean;
    configured: boolean;
  };
  waitlist: {
    ttlValid: boolean;
    urgencyFlagSet: boolean;
  };
  missingInProduction: string[];
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

let cachedSummary: WaitlistEnvSummary | null = null;

export function ensureWaitlistEnv(): WaitlistEnvSummary {
  if (cachedSummary) {
    return cachedSummary;
  }

  const runtime = resolveRuntime();
  const missingInProduction: string[] = [];
  const warnings: string[] = [];

  const hasServiceAccount = hasEnv('FIREBASE_ADMIN_SA_B64') || hasEnv('FIREBASE_SERVICE_ACCOUNT');
  const hasProjectId = hasEnv('FIREBASE_PROJECT_ID');
  const hasRegion = hasEnv('FIREBASE_DB_REGION');

  if (!hasServiceAccount) {
    missingInProduction.push('FIREBASE_ADMIN_SA_B64 (or FIREBASE_SERVICE_ACCOUNT)');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('Firebase Admin credentials missing; Firestore writes will fail.');
    }
  }
  if (!hasProjectId) {
    missingInProduction.push('FIREBASE_PROJECT_ID');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('FIREBASE_PROJECT_ID missing; Firestore not configured.');
    }
  }
  if (!hasRegion) {
    missingInProduction.push('FIREBASE_DB_REGION');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('FIREBASE_DB_REGION missing; Firestore region defaults may be incorrect.');
    }
  }

  const hasResendApiKey = hasEnv('RESEND_API_KEY');
  const hasResendFrom = hasEnv('RESEND_FROM');
  const hasResendReplyTo = hasEnv('RESEND_REPLY_TO');

  if (!hasResendApiKey) {
    missingInProduction.push('RESEND_API_KEY');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('RESEND_API_KEY missing; emails will run in noop sandbox mode.');
    }
  }
  if (!hasResendFrom) {
    missingInProduction.push('RESEND_FROM');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('RESEND_FROM missing; emails cannot set From address.');
    }
  }
  if (!hasResendReplyTo) {
    missingInProduction.push('RESEND_REPLY_TO');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('RESEND_REPLY_TO missing; Reply-To will fall back to support defaults.');
    }
  }

  const hasCaptchaSite = hasEnv('NEXT_PUBLIC_HCAPTCHA_SITE_KEY');
  const hasCaptchaSecret = hasEnv('HCAPTCHA_SECRET');
  if (!hasCaptchaSite) {
    missingInProduction.push('NEXT_PUBLIC_HCAPTCHA_SITE_KEY');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('NEXT_PUBLIC_HCAPTCHA_SITE_KEY missing; captcha will fail locally.');
    }
  }
  if (!hasCaptchaSecret) {
    missingInProduction.push('HCAPTCHA_SECRET');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('HCAPTCHA_SECRET missing; captcha verification disabled.');
    }
  }

  const ttlRaw = process.env.WAITLIST_CONFIRM_TTL_DAYS;
  const ttlValid = parsePositiveInteger(ttlRaw);
  if (!ttlValid) {
    missingInProduction.push('WAITLIST_CONFIRM_TTL_DAYS (must be a positive integer)');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('WAITLIST_CONFIRM_TTL_DAYS invalid; defaulting to 7 days locally.');
    }
  }

  const hasUrgencyFlag = hasEnv('NEXT_PUBLIC_WAITLIST_URGENCY');
  if (!hasUrgencyFlag) {
    missingInProduction.push('NEXT_PUBLIC_WAITLIST_URGENCY');
    if (!runtime.isProduction && !runtime.isTest) {
      warnings.push('NEXT_PUBLIC_WAITLIST_URGENCY missing; defaulting to enabled locally.');
    }
  }

  if (runtime.isProduction && missingInProduction.length > 0) {
    const formatted = missingInProduction.join(', ');
    throw new Error(`${WAITLIST_ENV_PREFIX} Missing required environment variables: ${formatted}`);
  }

  if (!runtime.isTest && warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(`${WAITLIST_ENV_PREFIX} ${warning}`);
    }
  }

  const summary: WaitlistEnvSummary = {
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
      hasSiteKey: hasCaptchaSite,
      hasSecret: hasCaptchaSecret,
      configured: hasCaptchaSite && hasCaptchaSecret,
    },
    waitlist: {
      ttlValid,
      urgencyFlagSet: hasUrgencyFlag,
    },
    missingInProduction,
  };

  cachedSummary = summary;
  return summary;
}

export type { WaitlistEnvSummary };
