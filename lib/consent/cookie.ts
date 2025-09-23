export const COOKIE_NAME = 'louhen_consent';

export type ConsentCookieValue = {
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

type CookieSource = { get(name: string): string | null } | string | null | undefined;

function extractRawCookie(source: CookieSource): string | null {
  if (!source) return null;

  if (typeof source === 'string') {
    return source;
  }

  if (typeof (source as Headers).get === 'function') {
    return (source as Headers).get('cookie');
  }

  return null;
}

export function parseConsentCookie(source: CookieSource): ConsentCookieValue | null {
  const rawCookieHeader = extractRawCookie(source);
  if (!rawCookieHeader) return null;

  const cookies = rawCookieHeader.split(';').map((cookie) => cookie.trim());
  const entry = cookies.find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));
  if (!entry) return null;

  const value = entry.substring(COOKIE_NAME.length + 1);
  if (!value) return null;

  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as Partial<ConsentCookieValue> | undefined;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.analytics !== 'boolean') parsed.analytics = false;
    if (typeof parsed.marketing !== 'boolean') parsed.marketing = false;
    if (typeof parsed.timestamp !== 'string') parsed.timestamp = new Date().toISOString();
    return {
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

type SerializeOptions = {
  maxAge?: number;
};

export function serializeConsentCookie(value: ConsentCookieValue, options: SerializeOptions = {}): string {
  const { maxAge = 60 * 60 * 24 * 365 } = options; // default one year
  const encoded = encodeURIComponent(JSON.stringify(value));
  const segments = [
    `${COOKIE_NAME}=${encoded}`,
    'Path=/',
    `Max-Age=${Math.max(0, Math.floor(maxAge))}`,
    'SameSite=Lax',
  ];

  const isSecure = process.env.NODE_ENV === 'production';
  if (isSecure) {
    segments.push('Secure');
  }

  return segments.join('; ');
}
