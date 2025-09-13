import './globals.css'
import type { Metadata, Viewport } from 'next'
import ThemeInit from '@/components/ThemeInit';
import SiteHeader from '@/components/SiteHeader';
import { SITE_NAME, LEGAL_ENTITY } from '@/constants/site';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://louhen-landing.vercel.app'),
  title: 'Louhen — Personal style. Effortless fit.',
  description: 'Join the Louhen waitlist and get smarter sizing, curated looks, and fit feedback that improves with every try.',
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
    title: 'Louhen — Personal style. Effortless fit.',
    description: 'Join the Louhen waitlist and get smarter sizing, curated looks, and fit feedback that improves with every try.',
    url: '/',
    siteName: SITE_NAME,
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Louhen — Personal style. Effortless fit.',
    description: 'Join the Louhen waitlist and get smarter sizing, curated looks, and fit feedback that improves with every try.',
    images: ['/opengraph-image.png'],
  },
}

// Move theme color to viewport for Next.js metadata API compatibility
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1220' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Normalize env flag to avoid whitespace/case pitfalls
  const onboardingEnabled = ((process.env.NEXT_PUBLIC_ONBOARDING_ENABLED ?? '').trim().toLowerCase() === 'true');
  return (
    <html lang="en">
      <head>
        {/* iOS PWA / status bar styling */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-white text-slate-900 antialiased font-sans">
        {/* Apply theme/contrast on first paint + react to system changes */}
        <ThemeInit />
        <SiteHeader onboardingEnabled={onboardingEnabled} legalEntity={LEGAL_ENTITY} />
        {children}
      </body>
    </html>
  )
}
