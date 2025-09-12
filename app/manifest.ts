import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/constants/site';

export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://louhen-landing.vercel.app';
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: `${SITE_NAME} — Perfect fit for growing feet`,
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
