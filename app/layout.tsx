import './globals.css'
import './styles/tokens.css'
import type { Metadata, Viewport } from 'next'
import ThemeInit from '@/components/ThemeInit';
import { SITE_NAME } from '@/constants/site';
import tokens from '@louhen/design-tokens/build/web/tokens.json' assert { type: 'json' };

const tokenValues = tokens as Record<string, unknown> & {
  color?: {
    background?: {
      canvas?: { value?: string };
      surface?: { value?: string };
      canvasDark?: { value?: string };
      surfaceDark?: { value?: string };
    };
  };
};

const THEME_COLOR_LIGHT =
  (tokenValues.color?.background?.canvas?.value as string | undefined) ||
  (tokenValues.color?.background?.surface?.value as string | undefined) ||
  (tokenValues['--semantic-color-bg-page'] as string | undefined) ||
  (tokenValues['--semantic-color-bg-card'] as string | undefined) ||
  (tokenValues['--color-light-surface'] as string | undefined) ||
  'currentColor';

const THEME_COLOR_DARK =
  (tokenValues.color?.background?.canvasDark?.value as string | undefined) ||
  (tokenValues.color?.background?.surfaceDark?.value as string | undefined) ||
  (tokenValues['--semanticDark-color-bg-page'] as string | undefined) ||
  (tokenValues['--color-dark-surface'] as string | undefined) ||
  THEME_COLOR_LIGHT;

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

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_COLOR_LIGHT },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLOR_DARK },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* iOS PWA / status bar styling */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content={THEME_COLOR_LIGHT} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={THEME_COLOR_DARK} media="(prefers-color-scheme: dark)" />
      </head>
      <body
        className="min-h-screen antialiased font-sans"
        style={{
          background: 'var(--semantic-color-bg-page)',
          color: 'var(--semantic-color-text-body)',
        }}
      >
        {/* Apply theme/contrast on first paint + react to system changes */}
        <ThemeInit />
        {children}
      </body>
    </html>
  )
}
