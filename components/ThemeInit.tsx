'use client';

import { useEffect } from 'react';
import tokens from '@/packages/design-tokens/build/web/tokens.json';
import {
  applyThemeFromMedia,
  getSavedContrast,
  getSavedTheme,
  subscribeToSystemPreferences,
} from '@/app/theme-client';

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
    applyThemeFromMedia();
    setMetaThemeFromTokens();

    const unsubscribe = subscribeToSystemPreferences(() => {
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

  return null;
}
