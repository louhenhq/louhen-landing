'use client';

import {
  COOKIE_PATH,
  COOKIE_SAME_SITE,
  CONTRAST_COOKIE,
  ContrastPreference,
  PREFERENCE_COOKIE_MAX_AGE,
  THEME_COOKIE,
  ThemePreference,
} from '@/lib/theme/constants';

const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)';
const PREFERS_CONTRAST_QUERY = '(prefers-contrast: more)';
const FORCED_COLORS_QUERY = '(forced-colors: active)';

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const cookie of cookies) {
    if (!cookie) continue;
    const [key, ...rest] = cookie.split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('='));
    }
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
