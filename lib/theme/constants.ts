export type ThemePreference = 'system' | 'light' | 'dark';
export type ContrastPreference = 'system' | 'normal' | 'more';

export const THEME_COOKIE = 'lh_theme';
export const CONTRAST_COOKIE = 'lh_contrast';

// 180 days (~6 months)
export const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

export const COOKIE_PATH = '/';
export const COOKIE_SAME_SITE = 'Lax';

export type LocalePreference = 'system' | string;
export const LOCALE_COOKIE = 'louhen_locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
