import { ImageResponse } from 'next/og';
import { SITE_NAME } from '@/constants/site';
import { LEGAL_ENTITY } from '@/constants/site';
import tokens from '@/packages/design-tokens/build/web/tokens.json';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 } as const;
export const contentType = 'image/png';

function cssVar(name: string, fallback: string) {
  // @ts-expect-error index-by-css-var
  return (tokens?.[name] as string | undefined) ?? fallback;
}

export default async function OG() {
  // Brand gradient (teal -> mint)
  const teal  = cssVar('--color-brand-teal',  '#1A4E5F');
  const mint  = cssVar('--color-brand-mint',  '#A8DADC');
  const coral = cssVar('--color-brand-coral', '#FF6B6B');

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${teal} 0%, ${mint} 100%)`,
        padding: 64,
        justifyContent: 'space-between',
      }}
    >
      {/* Top badge / logo area (drop in your SVG later) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          color: 'white',
          fontSize: 28,
          fontWeight: 600,
          opacity: 0.95,
        }}
      >
        {/* Placeholder dot as logo */}
        <div style={{ width: 18, height: 18, borderRadius: 999, background: coral }} />
        <div>{SITE_NAME}</div>
      </div>

      {/* Headline */}
      <div
        style={{
          color: 'white',
          fontSize: 86,
          fontWeight: 800,
          lineHeight: 1.04,
          letterSpacing: -2,
          textShadow: '0 8px 24px rgba(0,0,0,0.25)',
          maxWidth: 1000,
        }}
      >
        Personal style. Effortless fit.
      </div>

      {/* Footer line */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'rgba(255,255,255,0.95)',
          fontSize: 24,
          fontWeight: 600,
        }}
      >
        <span>louhen.com</span>
        <span>{LEGAL_ENTITY}</span>
      </div>
    </div>,
    { ...size }
  );
}
