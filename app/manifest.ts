import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/constants/site';
// JSON tokens emitted by Style Dictionary (light defaults)
import tokens from '@/packages/design-tokens/build/web/tokens.json';

function cssVar(name: string) {
  // tokens.json keys are CSS vars like "--semantic-color-bg-page"
  const value = tokens?.[name as keyof typeof tokens];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing expected token: ${name}`);
  }
  return value;
}

export default function manifest(): MetadataRoute.Manifest {
  const themeColor = cssVar('--semantic-color-bg-page');
  const bgColor = cssVar('--semantic-color-bg-page');
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    start_url: '/',
    display: 'standalone',
    background_color: bgColor,
    theme_color: themeColor,
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
