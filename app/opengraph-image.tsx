import { SITE_NAME } from '@/constants/site';
export const runtime = 'edge';
export const alt = `${SITE_NAME} — Perfect fit for growing feet`;
export const size = { width: 1200, height: 630 } as const;
export const contentType = 'image/png';

import { ImageResponse } from 'next/og';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 64,
          background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              height: 56,
              width: 56,
              borderRadius: 16,
              background: '#0f172a',
            }}
          />
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{SITE_NAME}</div>
        </div>
        <div style={{ fontSize: 68, fontWeight: 800, color: '#0b1220', lineHeight: 1.1 }}>
          Perfect fit for growing feet.
        </div>
        <div style={{ marginTop: 18, fontSize: 28, color: '#334155', maxWidth: 900 }}>
          Fit-first shoe companion for kids 10 months to 6 years. LouhenFit Guarantee included.
        </div>
      </div>
    ),
    { ...size }
  );
}
