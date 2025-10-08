'use client';

import {
  CONTRAST_COOKIE_NAME,
  CONTRAST_STORAGE_KEY,
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
} from '@/lib/theme/constants';

type ThemePref = 'system' | 'light' | 'dark';
type ContrastPref = 'system' | 'normal' | 'more';

const THEME_KEY = THEME_STORAGE_KEY;
const CONTRAST_KEY = CONTRAST_STORAGE_KEY;
const COOKIE_THEME_KEY = THEME_COOKIE_NAME;
const COOKIE_CONTRAST_KEY = CONTRAST_COOKIE_NAME;

function setCookie(name: string, value: string | null) {
  if (typeof document === 'undefined') return;
  const directives = [`Path=/`, `SameSite=Lax`];
  if (process.env.NODE_ENV === 'production') directives.push('Secure');
  if (!value || value === 'system') {
    document.cookie = `${name}=; ${directives.join('; ')}; Max-Age=0`;
    return;
  }
  document.cookie = `${name}=${value}; ${directives.join('; ')}; Max-Age=${THEME_COOKIE_MAX_AGE}`;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  const rawValue = match?.[1];
  return typeof rawValue === 'string' ? decodeURIComponent(rawValue) : null;
}

function resolveThemePreference(value: string | null | undefined): ThemePref {
  if (value === 'light' || value === 'dark') return value;
  return 'system';
}

export function getSavedTheme(): ThemePref {
  if (typeof window === 'undefined') return 'system';
  const storageValue = localStorage.getItem(THEME_KEY) as ThemePref | null;
  if (storageValue) return resolveThemePreference(storageValue);
  const cookieValue = readCookie(COOKIE_THEME_KEY);
  return resolveThemePreference(cookieValue);
}

export function getSavedContrast(): ContrastPref {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(CONTRAST_KEY) as ContrastPref) || 'system';
}

export function setTheme(pref: ThemePref) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement; // must be <html> for :root[...] selectors
  if (pref === 'system') {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) el.setAttribute('data-theme', 'dark');
    else el.removeAttribute('data-theme');
    localStorage.removeItem(THEME_KEY);
    setCookie(COOKIE_THEME_KEY, null);
  } else {
    el.setAttribute('data-theme', pref);
    localStorage.setItem(THEME_KEY, pref);
    setCookie(COOKIE_THEME_KEY, pref);
  }
}

export function setContrast(pref: ContrastPref) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement; // also on <html>
  if (pref === 'system' || pref === 'normal') {
    el.removeAttribute('data-contrast');
    if (pref === 'system') localStorage.removeItem(CONTRAST_KEY);
    else localStorage.setItem(CONTRAST_KEY, pref);
    setCookie(COOKIE_CONTRAST_KEY, pref === 'system' ? null : pref);
  } else {
    el.setAttribute('data-contrast', 'more');
    localStorage.setItem(CONTRAST_KEY, pref);
    setCookie(COOKIE_CONTRAST_KEY, pref);
  }
}

// Apply system prefs (used by ThemeInit)
export function applyThemeFromMedia() {
  if (typeof window === 'undefined') return;
  const savedTheme = getSavedTheme();
  const savedContrast = getSavedContrast();
  if (savedTheme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Set attributes to reflect system
    if (prefersDark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    setCookie(COOKIE_THEME_KEY, null);
    localStorage.removeItem(THEME_KEY);
  }
  if (savedContrast === 'system') {
    const prefersMore = window.matchMedia('(prefers-contrast: more)').matches
      || window.matchMedia('(forced-colors: active)').matches;
    if (prefersMore) {
      document.documentElement.setAttribute('data-contrast', 'more');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
    localStorage.removeItem(CONTRAST_KEY);
    setCookie(COOKIE_CONTRAST_KEY, null);
  }
}
