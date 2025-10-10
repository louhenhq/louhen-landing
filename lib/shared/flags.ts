import { getSiteOrigin as getBaseSiteOrigin } from '@/lib/shared/url/get-site-origin';

type VercelEnv = 'development' | 'preview' | 'production' | (string & {});

export type FeatureFlags = {
  OG_DYNAMIC_ENABLED: boolean;
  ANALYTICS_ENABLED: boolean;
  SECURITY_REPORT_ONLY: boolean;
  BANNER_WAITLIST_URGENCY: boolean;
};

export type GetFlagsContext = {
  /**
   * Optional request (or request-like) object whose headers will be inspected
   * for preview flag overrides. Pass a NextRequest, Request, or any object
   * exposing a `headers.get()` API.
   */
  request?: Pick<Request, 'headers'> | { headers: { get(name: string): string | null | undefined } };
  /**
   * Pre-parsed Cookie header value. When supplied, this takes precedence over
   * inspecting `request.headers`.
   */
  cookieHeader?: string | null | undefined;
  /**
   * Optional array of cookies (e.g., from `cookies().getAll()`). When set,
   * this is serialised into a standard Cookie header.
   */
  cookies?: Array<{ name: string; value: string }>;
};

type PublicFlagKey = 'ANALYTICS_ENABLED' | 'BANNER_WAITLIST_URGENCY';

type PublicFlagOverrides = Partial<Pick<FeatureFlags, PublicFlagKey>>;

const FLAG_COOKIE_NAME = 'll_flag_overrides';
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

let ogDynamicOverride: boolean | null = null;

const PUBLIC_FLAG_ENV_MAP: Record<PublicFlagKey, { primary: string; fallback?: string; default: () => boolean }> = {
  ANALYTICS_ENABLED: {
    primary: 'NEXT_PUBLIC_ANALYTICS_ENABLED',
    // Support legacy inverse flag until removed from environments.
    fallback: 'NEXT_PUBLIC_ANALYTICS_DISABLED',
    default: () => (isProduction() ? true : false),
  },
  BANNER_WAITLIST_URGENCY: {
    primary: 'NEXT_PUBLIC_BANNER_WAITLIST_URGENCY',
    fallback: 'NEXT_PUBLIC_WAITLIST_URGENCY',
    default: () => true,
  },
};

const SERVER_FLAG_DEFAULTS: Pick<FeatureFlags, 'OG_DYNAMIC_ENABLED' | 'SECURITY_REPORT_ONLY'> = {
  OG_DYNAMIC_ENABLED: true,
  SECURITY_REPORT_ONLY: true,
};

function normalizeEnvBoolean(raw: string | null | undefined): boolean | null {
  if (raw === undefined || raw === null) return null;
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return null;
}

function readPublicFlag(key: PublicFlagKey): boolean {
  const descriptor = PUBLIC_FLAG_ENV_MAP[key];
  const primary = normalizeEnvBoolean(process.env[descriptor.primary]);
  if (primary !== null) {
    return primary;
  }
  if (key === 'ANALYTICS_ENABLED') {
    const legacy = normalizeEnvBoolean(process.env[descriptor.fallback ?? '']);
    if (legacy !== null) {
      // Legacy flag disables analytics when set to truthy.
      return !legacy;
    }
  } else if (descriptor.fallback) {
    const fallback = normalizeEnvBoolean(process.env[descriptor.fallback]);
    if (fallback !== null) {
      return fallback;
    }
  }
  return descriptor.default();
}

function readOgDynamicFlag(): boolean {
  const explicit = normalizeEnvBoolean(process.env.OG_DYNAMIC_ENABLED);
  if (explicit !== null) {
    return explicit;
  }
  // Support legacy disable toggles (`OG_DYNAMIC_DISABLED`, `NEXT_PUBLIC_...`) for backwards compatibility.
  const legacyDisable =
    normalizeEnvBoolean(process.env.OG_DYNAMIC_DISABLED) ??
    normalizeEnvBoolean(process.env.NEXT_PUBLIC_OG_DYNAMIC_DISABLED);
  if (legacyDisable !== null) {
    return !legacyDisable;
  }
  return SERVER_FLAG_DEFAULTS.OG_DYNAMIC_ENABLED;
}

function readSecurityReportOnlyFlag(): boolean {
  const explicit = normalizeEnvBoolean(process.env.SECURITY_REPORT_ONLY);
  if (explicit !== null) {
    return explicit;
  }
  return isPreview() ? SERVER_FLAG_DEFAULTS.SECURITY_REPORT_ONLY : false;
}

function computeBaseFlags(): FeatureFlags {
  return {
    OG_DYNAMIC_ENABLED: readOgDynamicFlag(),
    ANALYTICS_ENABLED: readPublicFlag('ANALYTICS_ENABLED'),
    SECURITY_REPORT_ONLY: readSecurityReportOnlyFlag(),
    BANNER_WAITLIST_URGENCY: readPublicFlag('BANNER_WAITLIST_URGENCY'),
  };
}

function extractCookieString(context?: GetFlagsContext): string | null {
  if (typeof window !== 'undefined') {
    return typeof document === 'undefined' ? null : document.cookie ?? null;
  }
  if (context?.cookies && context.cookies.length) {
    return context.cookies.map(({ name, value }) => `${name}=${value}`).join('; ');
  }
  if (context?.cookieHeader !== undefined) {
    return context.cookieHeader ?? null;
  }
  if (context?.request) {
    try {
      const value = context.request.headers.get('cookie');
      return value ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

function parseCookieOverrides(cookieHeader: string | null): PublicFlagOverrides {
  if (!cookieHeader) return {};
  if (!cookieHeader.includes(FLAG_COOKIE_NAME)) return {};

  const entries = cookieHeader.split(';');
  const match = entries
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${FLAG_COOKIE_NAME}=`));

  if (!match) return {};

  const raw = match.substring(FLAG_COOKIE_NAME.length + 1);
  if (!raw) return {};

  try {
    const decoded = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    const overrides: PublicFlagOverrides = {};
    (Object.keys(PUBLIC_FLAG_ENV_MAP) as PublicFlagKey[]).forEach((key) => {
      const value = decoded[key];
      if (typeof value === 'boolean') {
        overrides[key] = value;
      }
    });
    return overrides;
  } catch {
    return {};
  }
}

function mergeOverrides(base: FeatureFlags, overrides: PublicFlagOverrides): FeatureFlags {
  if (!Object.keys(overrides).length) {
    return base;
  }
  return {
    ...base,
    ...overrides,
  };
}

function applyServerOverrides(base: FeatureFlags): FeatureFlags {
  if (ogDynamicOverride === null) {
    return base;
  }
  return {
    ...base,
    OG_DYNAMIC_ENABLED: ogDynamicOverride,
  };
}

export function getFlags(context?: GetFlagsContext): FeatureFlags {
  const base = computeBaseFlags();
  if (!isPreview()) {
    return applyServerOverrides(base);
  }

  const overrides = parseCookieOverrides(extractCookieString(context));
  return applyServerOverrides(mergeOverrides(base, overrides));
}

export function isProduction(): boolean {
  const vercelEnv = (process.env.VERCEL_ENV ?? '').toLowerCase() as VercelEnv;
  if (vercelEnv) {
    return vercelEnv === 'production';
  }
  return process.env.NODE_ENV === 'production';
}

export function isPreview(): boolean {
  const vercelEnv = (process.env.VERCEL_ENV ?? '').toLowerCase() as VercelEnv;
  if (vercelEnv === 'preview') return true;
  if (vercelEnv === 'production') return false;
  if (vercelEnv === 'development') return true;
  return !isProduction();
}

export function getSiteOrigin(): string {
  return getBaseSiteOrigin();
}

export { FLAG_COOKIE_NAME };

export function setOgDynamicOverride(override: boolean | null): void {
  ogDynamicOverride = override;
}
