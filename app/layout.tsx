import './globals.css'
import './styles/tokens.css'
import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import ThemeInit from '@/components/ThemeInit'
import { ConsentProvider } from '@/components/ConsentProvider'
import AnalyticsInit from '@/components/AnalyticsInit'
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/SeoJsonLd'
import { PageReadySentinel } from '@/components/PageReadySentinel'
import { SITE_NAME } from '@/constants/site'
import { parseConsentFromCookie } from '@/lib/shared/consent/api'
import { NonceProvider } from '@/lib/csp/nonce-context'
import { CONTRAST_COOKIE_NAME, THEME_COOKIE_NAME } from '@/lib/theme/constants'
import tokens from '@louhen/design-tokens/build/web/tokens.json' assert { type: 'json' }
import { THEME_INIT_SNIPPET } from '@/lib/theme/init-snippet'
import { DEFAULT_LOCALE } from '@/lib/i18n/locales'
import { buildAlternateLanguageMap } from '@/lib/i18n/metadata'
import { getOgImageEntry } from '@lib/shared/og/builder'

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
  (tokenValues['--color-light-surface'] as string | undefined) ||
  (tokenValues['--semantic-color-bg-page'] as string | undefined) ||
  'currentColor';

const THEME_COLOR_DARK =
  (tokenValues.color?.background?.canvasDark?.value as string | undefined) ||
  (tokenValues.color?.background?.surfaceDark?.value as string | undefined) ||
  (tokenValues['--color-dark-surface'] as string | undefined) ||
  (tokenValues['--semanticDark-color-bg-page'] as string | undefined) ||
  THEME_COLOR_LIGHT;

const FALLBACK_SITE_URL = 'https://louhen-landing.vercel.app'
const rawBaseUrl = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL
const baseUrl = rawBaseUrl.replace(/\/$/, '')
const metadataBaseUrl = `${baseUrl}/`
const defaultDescription =
  'Join the Louhen waitlist and get smarter sizing, curated looks, and fit feedback that improves with every try.'
const defaultTitle = 'Louhen — Personal style. Effortless fit.'
const ogImage = getOgImageEntry({
  locale: DEFAULT_LOCALE.value,
  key: 'home',
  title: defaultTitle,
  description: defaultDescription,
})
const themeScript = THEME_INIT_SNIPPET

function getCookieValue(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: {
    default: defaultTitle,
    template: '%s — Louhen',
  },
  description: defaultDescription,
  applicationName: SITE_NAME,
  alternates: {
    canonical: '/',
    languages: buildAlternateLanguageMap('/'),
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    title: defaultTitle,
    description: defaultDescription,
    url: '/',
    siteName: SITE_NAME,
    images: [ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@louhenhq',
    creator: '@louhenhq',
    title: defaultTitle,
    description: defaultDescription,
    images: [ogImage.url],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_COLOR_LIGHT },
    { media: '(prefers-color-scheme: dark)', color: THEME_COLOR_DARK },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const consentHeaders = await headers();
  const nonce = consentHeaders.get('x-csp-nonce') ?? undefined;
  const cookieHeader = consentHeaders.get('cookie');
  const consent = parseConsentFromCookie(cookieHeader);
  const cookieTheme = getCookieValue(cookieHeader, THEME_COOKIE_NAME);
  const cookieContrast = getCookieValue(cookieHeader, CONTRAST_COOKIE_NAME);
  const initialThemeAttr = cookieTheme === 'light' || cookieTheme === 'dark' ? cookieTheme : undefined;
  const initialContrastAttr = cookieContrast === 'more' ? 'more' : undefined;
  const shouldNoIndex = typeof process.env.VERCEL_ENV === 'string' && process.env.VERCEL_ENV !== 'production'
  const allowIndexOverride = process.env.LH_ALLOW_INDEX === 'true'
  const sameAsProfiles = [
    'https://www.linkedin.com/company/louhen',
    'https://www.instagram.com/louhen',
  ]
  const searchActionUrl = `${baseUrl}/search?q={search_term_string}`

  return (
    <html lang="en" data-theme={initialThemeAttr} data-contrast={initialContrastAttr ?? undefined}>
      <head>
        {/* iOS PWA / status bar styling */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content={THEME_COLOR_LIGHT} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={THEME_COLOR_DARK} media="(prefers-color-scheme: dark)" />
        <meta name="color-scheme" content="light dark" />
        <meta name="description" content={defaultDescription} key="global-description" />
        {shouldNoIndex ? <meta name="robots" content="noindex,nofollow" /> : null}
        {!shouldNoIndex && allowIndexOverride ? <meta name="robots" content="index,follow" /> : null}
        <script
          id="theme-pref-init"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <OrganizationJsonLd
          name={SITE_NAME}
          url={baseUrl}
          logo={`${baseUrl}/icon-512.png`}
          sameAs={sameAsProfiles}
          nonce={nonce}
        />
        <WebSiteJsonLd
          name={SITE_NAME}
          url={baseUrl}
          searchUrl={searchActionUrl}
          nonce={nonce}
        />
      </head>
      <body className="min-h-screen antialiased font-sans">
        <NonceProvider nonce={nonce}>
          <ConsentProvider initialState={consent}>
            {/* Apply theme/contrast on first paint + react to system changes */}
            <ThemeInit />
            <AnalyticsInit endpoint="/api/track" />
            <PageReadySentinel />
            <span
              data-testid="lh-csp-nonce"
              data-state={nonce ? 'present' : 'missing'}
              aria-hidden="true"
              style={{ position: 'fixed', inset: 'auto auto 0 0', width: 1, height: 1, overflow: 'hidden', pointerEvents: 'none', opacity: 0 }}
            />
            {children}
          </ConsentProvider>
        </NonceProvider>
      </body>
    </html>
  )
}
