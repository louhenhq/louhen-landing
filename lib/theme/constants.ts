export type ThemePreference = 'system' | 'light' | 'dark';
export type ContrastPreference = 'system' | 'normal' | 'more';

export const THEME_STORAGE_KEY = 'lh_theme_pref';
export const CONTRAST_STORAGE_KEY = 'lh_contrast_pref';
export const THEME_COOKIE_NAME = 'lh_theme_pref';
export const CONTRAST_COOKIE_NAME = 'lh_contrast_pref';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export const THEME_COOKIE = THEME_COOKIE_NAME;
export const CONTRAST_COOKIE = CONTRAST_COOKIE_NAME;

export const COOKIE_PATH = '/';
export const COOKIE_SAME_SITE = 'Lax';

export const LOCALE_COOKIE = 'lh_locale_pref';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
