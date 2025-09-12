import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://louhen-landing.vercel.app'),
  title: {
    default: 'Louhen — Perfect fit for growing feet',
    template: '%s • Louhen',
  },
  description:
    'Fit-first shoe companion for kids 10 months to 6 years. Scan feet, get data-driven recommendations, and relax under our LouhenFit Guarantee.',
  applicationName: 'Louhen',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    title: 'Louhen — Perfect fit for growing feet',
    description:
      'Fit-first shoe companion for kids 10 months to 6 years. Scan feet, get data-driven recommendations, and relax under our LouhenFit Guarantee.',
    url: '/',
    siteName: 'Louhen',
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Louhen — Perfect fit for growing feet',
    description:
      'Fit-first shoe companion for kids 10 months to 6 years. Scan feet, get data-driven recommendations, and relax under our LouhenFit Guarantee.',
    images: ['/opengraph-image.png'],
  },
  // Hint browsers for color theming (fallback if manifest isn't picked up yet)
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* iOS PWA / status bar styling */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>{children}</body>
    </html>
  )
}
