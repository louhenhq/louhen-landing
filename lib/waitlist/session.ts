import { cookies } from 'next/headers';

const WAITLIST_SESSION_COOKIE = 'waitlist_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function setWaitlistSession(docId: string) {
  const value = docId.trim();
  if (!value) return;
  const store = cookies();
  store.set({
    name: WAITLIST_SESSION_COOKIE,
    value,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction(),
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearWaitlistSession() {
  const store = cookies();
  store.delete(WAITLIST_SESSION_COOKIE);
}

export function getWaitlistSession(): string | null {
  const store = cookies();
  const cookie = store.get(WAITLIST_SESSION_COOKIE);
  if (!cookie || !cookie.value.trim()) {
    return null;
  }
  return cookie.value.trim();
}

export { WAITLIST_SESSION_COOKIE };
