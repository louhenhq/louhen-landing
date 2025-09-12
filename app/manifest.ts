import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://louhen-landing.vercel.app';
  return {
    name: 'Louhen',
    short_name: 'Louhen',
    description:
      'Fit-first shoe companion for kids 10 months to 6 years. Scan feet, get data-driven recommendations, and relax under our LouhenFit Guarantee.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    id: base + '/',
    categories: ['shopping', 'lifestyle'],
    lang: 'en',
    dir: 'ltr',
    orientation: 'portrait',
    prefer_related_applications: false,
  };
}

