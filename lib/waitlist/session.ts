import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const WAITLIST_SESSION_COOKIE = 'waitlist_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export async function readWaitlistSession(): Promise<string | null> {
  const store = await cookies();
  const cookie = store.get(WAITLIST_SESSION_COOKIE);
  return cookie?.value?.trim() || null;
}

export function setWaitlistSessionCookie(response: NextResponse, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return;
  response.cookies.set({
    name: WAITLIST_SESSION_COOKIE,
    value: trimmed,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction(),
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearWaitlistSessionCookie(response: NextResponse) {
  response.cookies.delete(WAITLIST_SESSION_COOKIE);
}

export { WAITLIST_SESSION_COOKIE };
