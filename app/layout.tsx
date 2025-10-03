import './globals.css'
import './styles/tokens.css'
import type { Metadata, Viewport } from 'next'
import { cookies, headers } from 'next/headers'
import { fraunces, inter } from './(site)/fonts'
import ThemeInit from '@/components/ThemeInit'
import { ConsentProvider } from '@/components/ConsentProvider'
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/SeoJsonLd'
import { SITE_NAME } from '@/constants/site'
import { getServerConsent } from '@/lib/consent/state'
import { NonceProvider } from '@/lib/csp/nonce-context'
import { buildAlternateLanguageMap } from '@/lib/i18n/metadata'
import tokens from '@louhen/design-tokens/build/web/tokens.json' assert { type: 'json' }
import {
  CONTRAST_COOKIE,
  ContrastPreference,
  THEME_COOKIE,
  ThemePreference,
} from '@/lib/theme/constants'
import { DEFAULT_LOCALE } from '@/lib/i18n/locales'

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

const allowIndexOverride = process.env.LH_ALLOW_INDEX === 'true'

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: {
    default: 'Louhen — Personal style. Effortless fit.',
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
    title: 'Louhen — Personal style. Effortless fit.',
    description: defaultDescription,
    url: '/',
    siteName: SITE_NAME,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Louhen — Personal style. Effortless fit.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@louhenhq',
    creator: '@louhenhq',
    title: 'Louhen — Personal style. Effortless fit.',
    description: defaultDescription,
    images: ['/opengraph-image.png'],
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
  const consent = getServerConsent(consentHeaders);
  const nonce = consentHeaders.get('x-csp-nonce') ?? undefined;
  const cookieStore = await cookies();

  const rawThemePref = (cookieStore.get(THEME_COOKIE)?.value as ThemePreference | undefined) ?? 'system';
  const themePref: ThemePreference =
    rawThemePref === 'light' || rawThemePref === 'dark' ? rawThemePref : 'system';

  const rawContrastPref = (cookieStore.get(CONTRAST_COOKIE)?.value as ContrastPreference | undefined) ?? 'system';
  const contrastPref: ContrastPreference =
    rawContrastPref === 'normal' || rawContrastPref === 'more' ? rawContrastPref : 'system';

  const clientThemeHint = consentHeaders.get('sec-ch-prefers-color-scheme')?.toLowerCase();
  const systemTheme = clientThemeHint === 'dark' ? 'dark' : clientThemeHint === 'light' ? 'light' : undefined;

  const clientContrastHint = consentHeaders.get('sec-ch-prefers-contrast')?.toLowerCase();
  const forcedColors = consentHeaders.get('sec-ch-forced-colors')?.toLowerCase();
  const systemContrast =
    forcedColors === 'active' || clientContrastHint === 'more' ? 'more' : clientContrastHint === 'less' ? 'normal' : undefined;

  const initialThemeAttr = themePref === 'system' ? systemTheme : themePref;
  const initialContrastAttr = contrastPref === 'system' ? systemContrast : contrastPref;
  const initialColorScheme = initialThemeAttr === 'dark' ? 'dark' : 'light';

  const themeScript = `(() => {
    try {
      const doc = document.documentElement;
      const pref = ${JSON.stringify(themePref)};
      const contrastPref = ${JSON.stringify(contrastPref)};
      const darkQuery = ${JSON.stringify('(prefers-color-scheme: dark)')};
      const contrastQuery = ${JSON.stringify('(prefers-contrast: more)')};
      const forcedQuery = ${JSON.stringify('(forced-colors: active)')};
      const prefersDark = window.matchMedia && window.matchMedia(darkQuery).matches;
      const prefersHighContrast =
        (window.matchMedia && window.matchMedia(forcedQuery).matches) ||
        (window.matchMedia && window.matchMedia(contrastQuery).matches);

      doc.setAttribute('data-theme-mode', pref);
      doc.setAttribute('data-contrast-mode', contrastPref);

      if (pref === 'dark') {
        doc.setAttribute('data-theme', 'dark');
      } else if (pref === 'light') {
        doc.setAttribute('data-theme', 'light');
      } else if (pref === 'system') {
        if (prefersDark) {
          doc.setAttribute('data-theme', 'dark');
        } else {
          doc.removeAttribute('data-theme');
        }
      }

      if (contrastPref === 'more') {
        doc.setAttribute('data-contrast', 'more');
      } else if (contrastPref === 'normal') {
        doc.setAttribute('data-contrast', 'normal');
      } else if (contrastPref === 'system') {
        if (prefersHighContrast) {
          doc.setAttribute('data-contrast', 'more');
        } else {
          doc.removeAttribute('data-contrast');
        }
      }

      const appliedTheme = doc.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      doc.style.colorScheme = appliedTheme;
    } catch (e) {
      // no-op
    }
  })();`;

  const shouldNoIndex =
    !allowIndexOverride && typeof process.env.VERCEL_ENV === 'string' && process.env.VERCEL_ENV !== 'production'
  const sameAsProfiles = [
    'https://www.linkedin.com/company/louhen',
    'https://www.instagram.com/louhen',
  ]
  const searchActionUrl = `${baseUrl}/search?q={search_term_string}`

  return (
    <html
      lang={DEFAULT_LOCALE.language}
      data-theme-mode={themePref}
      data-theme={initialThemeAttr ?? undefined}
      data-contrast-mode={contrastPref}
      data-contrast={initialContrastAttr ?? undefined}
      className={`${fraunces.variable} ${inter.variable}`}
      style={{ colorScheme: initialColorScheme }}
    >
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
          <ConsentProvider initialConsent={consent}>
            {/* Apply theme/contrast on first paint + react to system changes */}
            <ThemeInit />
            {children}
          </ConsentProvider>
        </NonceProvider>
      </body>
    </html>
  )
}
