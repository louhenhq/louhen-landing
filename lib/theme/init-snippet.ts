import {
  CONTRAST_COOKIE_NAME,
  CONTRAST_STORAGE_KEY,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
} from './constants';

export const THEME_INIT_SNIPPET = `(() => {
  try {
    const doc = document.documentElement;
    const themeKey = '${THEME_STORAGE_KEY}';
    const themeCookie = '${THEME_COOKIE_NAME}';
    const contrastKey = '${CONTRAST_STORAGE_KEY}';
    const contrastCookie = '${CONTRAST_COOKIE_NAME}';

    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    };

    const storedTheme = localStorage.getItem(themeKey) || getCookie(themeCookie);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (mode) => {
      if (mode === 'dark') {
        doc.setAttribute('data-theme', 'dark');
      } else if (mode === 'light') {
        doc.setAttribute('data-theme', 'light');
      } else {
        if (prefersDark && prefersDark.matches) doc.setAttribute('data-theme', 'dark');
        else doc.removeAttribute('data-theme');
      }
    };

    const themePref = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'system';
    applyTheme(themePref);

    const storedContrast = localStorage.getItem(contrastKey) || getCookie(contrastCookie);
    if (storedContrast === 'more') {
      doc.setAttribute('data-contrast', 'more');
    } else {
      doc.removeAttribute('data-contrast');
    }
  } catch (error) {
    // ignore
  }
})();`;
