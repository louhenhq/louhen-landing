
'use client';

import {
  CONTRAST_COOKIE_NAME,
  CONTRAST_STORAGE_KEY,
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
  type ContrastPreference,
  type ThemePreference,
} from '@/lib/theme/constants';

export type { ThemePreference, ContrastPreference } from '@/lib/theme/constants';

const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)';
const PREFERS_CONTRAST_QUERY = '(prefers-contrast: more)';
const FORCED_COLORS_QUERY = '(forced-colors: active)';

const THEME_KEY = THEME_STORAGE_KEY;
const CONTRAST_KEY = CONTRAST_STORAGE_KEY;
const COOKIE_THEME_KEY = THEME_COOKIE_NAME;
const COOKIE_CONTRAST_KEY = CONTRAST_COOKIE_NAME;

function setCookie(name: string, value: string | null) {
  if (typeof document === 'undefined') return;
  const directives = ['Path=/', 'SameSite=Lax'];
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

function resolveThemePreference(value: string | null | undefined): ThemePreference {
  if (value === 'light' || value === 'dark') return value;
  return 'system';
}

function resolveContrastPreference(value: string | null | undefined): ContrastPreference {
  if (value === 'normal' || value === 'more') return value;
  return 'system';
}

function resolveSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(PREFERS_DARK_QUERY).matches ? 'dark' : 'light';
}

export function getSavedTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const storageValue = localStorage.getItem(THEME_KEY) as ThemePreference | null;
  if (storageValue) return resolveThemePreference(storageValue);
  const cookieValue = readCookie(COOKIE_THEME_KEY);
  return resolveThemePreference(cookieValue);
}

export function getSavedContrast(): ContrastPreference {
  if (typeof window === 'undefined') return 'system';
  const storageValue = localStorage.getItem(CONTRAST_KEY) as ContrastPreference | null;
  if (storageValue) return resolveContrastPreference(storageValue);
  const cookieValue = readCookie(COOKIE_CONTRAST_KEY);
  return resolveContrastPreference(cookieValue);
}

export function setTheme(pref: ThemePreference) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement; // must be <html> for :root[...] selectors
  if (pref === 'system') {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia(PREFERS_DARK_QUERY).matches;
    if (prefersDark) el.setAttribute('data-theme', 'dark');
    else el.removeAttribute('data-theme');
    if (typeof localStorage !== 'undefined') localStorage.removeItem(THEME_KEY);
    setCookie(COOKIE_THEME_KEY, null);
  } else {
    el.setAttribute('data-theme', pref);
    if (typeof localStorage !== 'undefined') localStorage.setItem(THEME_KEY, pref);
    setCookie(COOKIE_THEME_KEY, pref);
  }
}

export function setContrast(pref: ContrastPreference) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement; // also on <html>
  if (pref === 'system' || pref === 'normal') {
    el.removeAttribute('data-contrast');
    if (typeof localStorage !== 'undefined') {
      if (pref === 'system') localStorage.removeItem(CONTRAST_KEY);
      else localStorage.setItem(CONTRAST_KEY, pref);
    }
    setCookie(COOKIE_CONTRAST_KEY, pref === 'system' ? null : pref);
  } else {
    el.setAttribute('data-contrast', 'more');
    if (typeof localStorage !== 'undefined') localStorage.setItem(CONTRAST_KEY, pref);
    setCookie(COOKIE_CONTRAST_KEY, pref);
  }
}

export function applyThemeFromMedia() {
  if (typeof window === 'undefined') return;
  const savedTheme = getSavedTheme();
  const savedContrast = getSavedContrast();
  if (savedTheme === 'system') {
    const prefersDark = window.matchMedia(PREFERS_DARK_QUERY).matches;
    if (prefersDark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    if (typeof localStorage !== 'undefined') localStorage.removeItem(THEME_KEY);
    setCookie(COOKIE_THEME_KEY, null);
  }
  if (savedContrast === 'system') {
    const prefersMore =
      window.matchMedia(PREFERS_CONTRAST_QUERY).matches || window.matchMedia(FORCED_COLORS_QUERY).matches;
    if (prefersMore) {
      document.documentElement.setAttribute('data-contrast', 'more');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
    if (typeof localStorage !== 'undefined') localStorage.removeItem(CONTRAST_KEY);
    setCookie(COOKIE_CONTRAST_KEY, null);
  }
}

export function subscribeToSystemPreferences(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const cleanup: Array<() => void> = [];

  const attach = (query: string) => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia(query);
    const handler = () => onChange();
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
      cleanup.push(() => mql.removeEventListener('change', handler));
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(handler);
      cleanup.push(() => mql.removeListener(handler));
    }
  };

  attach(PREFERS_DARK_QUERY);
  attach(PREFERS_CONTRAST_QUERY);
  attach(FORCED_COLORS_QUERY);

  return () => {
    cleanup.forEach((fn) => fn());
  };
}

export function currentColorScheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  return resolveSystemTheme();
}
