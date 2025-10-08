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
  return undefined;
}

function writeCookie(name: string, value: string | null) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  if (!value) {
    document.cookie = `${name}=; Path=${COOKIE_PATH}; Max-Age=0; SameSite=${COOKIE_SAME_SITE}${secure}`;
    return;
  }
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Path=${COOKIE_PATH}; Max-Age=${PREFERENCE_COOKIE_MAX_AGE}; SameSite=${COOKIE_SAME_SITE}` +
    secure;
}

function resolveSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(PREFERS_DARK_QUERY).matches ? 'dark' : 'light';
}

function resolveSystemContrast(): 'normal' | 'more' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'normal';
  if (window.matchMedia(FORCED_COLORS_QUERY).matches) return 'more';
  return window.matchMedia(PREFERS_CONTRAST_QUERY).matches ? 'more' : 'normal';
}

function applyDataset(theme: ThemePreference, contrast: ContrastPreference) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.setAttribute('data-theme-mode', theme);
  root.setAttribute('data-contrast-mode', contrast);

  const effectiveTheme = theme === 'system' ? resolveSystemTheme() : theme;
  if (effectiveTheme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }

  const effectiveContrast = contrast === 'system' ? resolveSystemContrast() : contrast;
  if (effectiveContrast === 'more') {
    root.setAttribute('data-contrast', 'more');
  } else if (contrast === 'normal') {
    root.setAttribute('data-contrast', 'normal');
  } else {
    root.removeAttribute('data-contrast');
  }

  const colorScheme = effectiveTheme === 'dark' ? 'dark' : 'light';
  root.style.colorScheme = colorScheme;
}

export function getSavedTheme(): ThemePreference {
  if (typeof document === 'undefined') return 'system';
  const stored = readCookie(THEME_COOKIE);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

export function getSavedContrast(): ContrastPreference {
  if (typeof document === 'undefined') return 'system';
  const stored = readCookie(CONTRAST_COOKIE);
  if (stored === 'normal' || stored === 'more' || stored === 'system') return stored;
  return 'system';
}

export function setTheme(pref: ThemePreference) {
  if (typeof document === 'undefined') return;
  if (pref === 'system') writeCookie(THEME_COOKIE, null);
  else writeCookie(THEME_COOKIE, pref);
  applyDataset(pref, getSavedContrast());
}

export function setContrast(pref: ContrastPreference) {
  if (typeof document === 'undefined') return;
  if (pref === 'system') writeCookie(CONTRAST_COOKIE, null);
  else writeCookie(CONTRAST_COOKIE, pref);
  applyDataset(getSavedTheme(), pref);
}

export function applyThemeFromMedia() {
  if (typeof document === 'undefined') return;
  applyDataset(getSavedTheme(), getSavedContrast());
}

export function subscribeToSystemPreferences(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const dark = window.matchMedia(PREFERS_DARK_QUERY);
  const contrast = window.matchMedia(PREFERS_CONTRAST_QUERY);
  const forced = window.matchMedia(FORCED_COLORS_QUERY);
  const handler = () => onChange();
  dark.addEventListener('change', handler);
  contrast.addEventListener('change', handler);
  forced.addEventListener('change', handler);
  return () => {
    dark.removeEventListener('change', handler);
    contrast.removeEventListener('change', handler);
    forced.removeEventListener('change', handler);
  };
}

export function currentColorScheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark') return 'dark';
  if (attr === 'light') return 'light';
  return resolveSystemTheme();
}
