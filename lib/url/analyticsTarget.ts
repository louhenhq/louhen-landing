const PLACEHOLDER_BASE = 'https://placeholder.invalid';

function normalizeHost(hostname: string): string {
  const lower = hostname.toLowerCase();
  if (lower.includes('apps.apple.com')) return 'app-store';
  if (lower.includes('play.google.com')) return 'google-play';
  return lower;
}

export function resolveAnalyticsTarget(raw: string): string {
  if (!raw) return '';
  if (raw.startsWith('#')) return raw;

  try {
    const hasProtocol = /^https?:\/\//i.test(raw);
    const url = hasProtocol ? new URL(raw) : new URL(raw, PLACEHOLDER_BASE);
    if (hasProtocol) {
      return normalizeHost(url.hostname);
    }
    return url.pathname || raw;
  } catch {
    return raw;
  }
}
