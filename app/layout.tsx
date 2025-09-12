import './globals.css'
import type { Metadata, Viewport } from 'next'
import SiteHeader from '@/components/SiteHeader';
import { SITE_NAME, LEGAL_ENTITY } from '@/constants/site';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://louhen-landing.vercel.app'),
  title: `${SITE_NAME} — Perfect fit for growing feet`,
  description: `${SITE_NAME} is a fit-first shoe companion for kids aged 10 months to 6 years.`,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    title: `${SITE_NAME} — Perfect fit for growing feet`,
    description: `${SITE_NAME} is a fit-first shoe companion for kids aged 10 months to 6 years.`,
    url: '/',
    siteName: SITE_NAME,
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Perfect fit for growing feet`,
    description: `${SITE_NAME} is a fit-first shoe companion for kids aged 10 months to 6 years.`,
    images: ['/opengraph-image.png'],
  },
}

// Move theme color to viewport for Next.js metadata API compatibility
export const viewport: Viewport = {
  themeColor: '#0f172a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const onboardingEnabled = process.env.NEXT_PUBLIC_ONBOARDING_ENABLED === 'true';
  return (
    <html lang="en">
      <head>
        {/* iOS PWA / status bar styling */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-white text-slate-900 antialiased font-sans">
        <SiteHeader onboardingEnabled={onboardingEnabled} legalEntity={LEGAL_ENTITY} />
        {children}
      </body>
    </html>
  )
}
