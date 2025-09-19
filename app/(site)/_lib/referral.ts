'use client';

import { track } from '@/lib/clientAnalytics';

const COOKIE_NAME = 'wl_ref';
const APPLIED_COOKIE_NAME = 'wl_ref_applied_at';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
const SESSION_PREFIX = '__wl_ref_applied__';

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setReferralCookie(ref: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(ref)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function setAppliedAtCookie(timestamp: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${APPLIED_COOKIE_NAME}=${timestamp}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function hasSessionFlag(ref: string): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) return false;
  try {
    return window.sessionStorage.getItem(`${SESSION_PREFIX}${ref}`) === '1';
  } catch {
    return false;
  }
}

function setSessionFlag(ref: string) {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(`${SESSION_PREFIX}${ref}`, '1');
  } catch {}
}

export function applyReferralFromURL(searchParams: URLSearchParams): boolean {
  if (typeof window === 'undefined') return false;
  const rawRef = searchParams.get('ref');
  if (!rawRef) return false;
  const normalized = rawRef.trim();
  if (!normalized) return false;
  const refUpper = normalized.toUpperCase();
  const currentCookie = (getCookieValue(COOKIE_NAME) || '').toUpperCase();
  if (currentCookie === refUpper && hasSessionFlag(refUpper)) {
    return false;
  }
  if (hasSessionFlag(refUpper)) {
    // Session flag exists, but cookie differs; update cookie silently.
    if (currentCookie !== refUpper) setReferralCookie(refUpper);
    return false;
  }
  setReferralCookie(refUpper);
  setAppliedAtCookie(Date.now());
  setSessionFlag(refUpper);
  track({ name: 'wl_referral_applied', ref: refUpper });
  return true;
}

export function getAppliedRef(): string | null {
  return (getCookieValue(COOKIE_NAME) || '').toUpperCase() || null;
}

export function isRecentApplication(maxAgeMs = 86_400_000): boolean {
  const raw = getCookieValue(APPLIED_COOKIE_NAME);
  if (!raw) return false;
  const appliedAt = Number(raw);
  if (Number.isNaN(appliedAt)) return false;
  return Date.now() - appliedAt < maxAgeMs;
}
