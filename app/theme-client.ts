'use client';

type ThemePref = 'system' | 'light' | 'dark';
type ContrastPref = 'system' | 'normal' | 'more';

const THEME_KEY = 'lh_theme_pref';
const CONTRAST_KEY = 'lh_contrast_pref';

export function getSavedTheme(): ThemePref {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(THEME_KEY) as ThemePref) || 'system';
}

export function getSavedContrast(): ContrastPref {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(CONTRAST_KEY) as ContrastPref) || 'system';
}

export function setTheme(pref: ThemePref) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  if (pref === 'system') {
    el.removeAttribute('data-theme');
    localStorage.removeItem(THEME_KEY);
  } else {
    el.setAttribute('data-theme', pref);
    localStorage.setItem(THEME_KEY, pref);
  }
}

export function setContrast(pref: ContrastPref) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  if (pref === 'system' || pref === 'normal') {
    el.removeAttribute('data-contrast');
    if (pref === 'system') localStorage.removeItem(CONTRAST_KEY);
    else localStorage.setItem(CONTRAST_KEY, pref);
  } else {
    el.setAttribute('data-contrast', 'more');
    localStorage.setItem(CONTRAST_KEY, pref);
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
  }
}
