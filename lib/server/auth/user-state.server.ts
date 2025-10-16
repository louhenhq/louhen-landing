import 'server-only';

import { cookies } from 'next/headers';

import { HEADER_AUTH_HINT_COOKIE, type HeaderUserState } from '@shared/auth/user-state';

type HeaderHintResult = {
  userState: HeaderUserState;
  source: 'cookie' | 'fallback';
};

const HINT_VALUES = new Set(['1', 'true', 'yes', 'hinted']);

export async function resolveHeaderUserState(): Promise<HeaderHintResult> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(HEADER_AUTH_HINT_COOKIE)?.value;
    if (raw && HINT_VALUES.has(raw.toLowerCase())) {
      return { userState: 'hinted', source: 'cookie' };
    }
  } catch {
    // Ignore cookie access issues; fall back to guest.
  }

  return { userState: 'guest', source: 'fallback' };
}

export async function getHeaderUserState(): Promise<HeaderUserState> {
  const result = await resolveHeaderUserState();
  return result.userState;
}
