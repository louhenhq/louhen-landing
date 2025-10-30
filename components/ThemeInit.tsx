'use client';

import { useEffect } from 'react';
import tokens from '@/packages/design-tokens/build/web/tokens.json';
import { applyThemeFromMedia, getSavedTheme, getSavedContrast } from '@/app/theme-client';
import { useNonce } from '@/lib/csp/nonce-context.client';
import { THEME_INIT_SNIPPET } from '@/lib/theme/init-snippet';

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

    const mediaCleanup: Array<() => void> = [];

    const handle = () => {
      if (getSavedTheme() === 'system' || getSavedContrast() === 'system') {
        applyThemeFromMedia();
      }
      setMetaThemeFromTokens();
      updateMeta();
    };

    const subscribe = (mql: MediaQueryList | undefined) => {
      if (!mql) return;
      const listener = () => handle();
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', listener);
        mediaCleanup.push(() => mql.removeEventListener('change', listener));
        return;
      }
      if (typeof mql.addListener === 'function') {
        mql.addListener(listener);
        mediaCleanup.push(() => mql.removeListener(listener));
      }
    };

    subscribe(mqlDark);
    subscribe(mqlContrast);
    subscribe(mqlForced);

    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === 'data-theme')) {
        setMetaThemeFromTokens();
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      mediaCleanup.forEach((fn) => fn());
      observer.disconnect();
    };
  }, []);
  return (
    <script
      suppressHydrationWarning
      nonce={nonce ?? undefined}
      dangerouslySetInnerHTML={{
        __html: THEME_INIT_SNIPPET,
      }}
    />
  );
}
