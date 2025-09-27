'use client';
import { useEffect } from 'react';
import tokens from '@/packages/design-tokens/build/web/tokens.json';
import { applyThemeFromMedia, getSavedTheme, getSavedContrast, setTheme, setContrast } from '@/app/theme-client';

const bgToken = tokens['--semantic-color-bg-page'];

const FALLBACK_BG = typeof bgToken === 'string' && bgToken.trim().length > 0 ? bgToken : 'rgb(255, 255, 255)';

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
  useEffect(() => {
    const t = getSavedTheme();
    const c = getSavedContrast();
    if (t === 'system' || c === 'system') applyThemeFromMedia();
    else {
      setTheme(t);
      setContrast(c);
    }
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
    };
    mqlDark.addEventListener('change', handle);
    mqlContrast.addEventListener('change', handle);
    mqlForced.addEventListener('change', handle);
    return () => {
      mqlDark.removeEventListener('change', handle);
      mqlContrast.removeEventListener('change', handle);
      mqlForced.removeEventListener('change', handle);
    };
  }, []);
  return null;
}
