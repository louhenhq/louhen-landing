export const HEADER_AUTH_HINT_COOKIE = 'LH_AUTH';

export type HeaderUserState = 'guest' | 'hinted';

export const DASHBOARD_FALLBACK_PATH = '/dashboard';
export const LOGOUT_FALLBACK_PATH = '/logout';

export function resolveDashboardUrl(): string {
  const raw = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim();
  return raw && raw.length > 0 ? raw : DASHBOARD_FALLBACK_PATH;
}

export function resolveLogoutUrl(): string {
  const raw = process.env.NEXT_PUBLIC_LOGOUT_URL?.trim();
  return raw && raw.length > 0 ? raw : LOGOUT_FALLBACK_PATH;
}
