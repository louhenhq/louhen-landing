'use client';

import { useEffect } from 'react';
import tokens from '@/packages/design-tokens/build/web/tokens.json';
import { applyThemeFromMedia, getSavedTheme, getSavedContrast, setTheme, setContrast } from '@/app/theme-client';
import { useNonce } from '@/lib/csp/nonce-context';
import {
  CONTRAST_COOKIE_NAME,
  CONTRAST_STORAGE_KEY,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
} from '@/lib/theme/constants';

const bgToken = tokens['--semantic-color-bg-page'];

const FALLBACK_BG = typeof bgToken === 'string' && bgToken.trim().length > 0 ? bgToken : 'rgb(255, 255, 255)';

const INIT_THEME_SNIPPET = `(() => {
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

function setMetaThemeFromTokens() {
  const root = document.documentElement;
  const bg = getComputedStyle(root).getPropertyValue('--semantic-color-bg-page').trim();
  const hex = bg || FALLBACK_BG;
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', hex);
}

export default function ThemeInit() {
  const nonce = useNonce();

  useEffect(() => {
    applyThemeFromMedia();
    setMetaThemeFromTokens();

    const mqlDark = window.matchMedia('(prefers-color-scheme: dark)');
    const mqlContrast = window.matchMedia('(prefers-contrast: more)');
    const mqlForced = window.matchMedia('(forced-colors: active)');

    const updateMeta = () => {
      const meta =
        (document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null) ||
        (() => {
          const m = document.createElement('meta');
          m.setAttribute('name', 'theme-color');
          document.head.appendChild(m);
          return m;
        })();
      const bg = getComputedStyle(document.documentElement)
        .getPropertyValue('--semantic-color-bg-page')
        .trim() || FALLBACK_BG;
      meta.setAttribute('content', bg);
    };

    updateMeta();

    const handle = () => {
      if (getSavedTheme() === 'system' || getSavedContrast() === 'system') {
        applyThemeFromMedia();
      }
      setMetaThemeFromTokens();
    });

    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === 'data-theme')) {
        setMetaThemeFromTokens();
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      unsubscribe();
      observer.disconnect();
    };
  }, []);
  return (
    <script
      suppressHydrationWarning
      nonce={nonce ?? undefined}
      dangerouslySetInnerHTML={{
        __html: INIT_THEME_SNIPPET,
      }}
    />
  );
}
