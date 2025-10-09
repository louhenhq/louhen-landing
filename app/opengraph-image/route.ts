import { createElement } from 'react';
import { ImageResponse } from 'next/og';
import { SITE_NAME, LEGAL_ENTITY } from '@/constants/site';
import { loadMessages } from '@/lib/intl/loadMessages';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/lib/shared/og/builder';
import { getStaticOg } from '@/lib/shared/og/fallback';
import { getFlags } from '@/lib/shared/flags';
import { defaultLocale, locales, type SupportedLocale } from '@/next-intl.locales';
import tokens from '@louhen/design-tokens/build/web/tokens.json' assert { type: 'json' };

export const runtime = 'edge';
export const size = { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT } as const;
export const contentType = 'image/png';

const DEFAULT_LOCALE: SupportedLocale = defaultLocale;
const VALID_KEYS = new Set([
  'home',
  'home-invited',
  'method',
  'waitlist',
  'confirm',
  'confirm-pending',
  'legal-privacy',
  'legal-terms',
  'imprint',
]);
const FALLBACK_KEY = 'home';
const FALLBACK_TITLE = 'Louhen';
const FALLBACK_DESCRIPTION = 'Tailored comfort backed by podiatrists.';
const MAX_TEXT_LENGTH = 220;
const MAX_REF_LENGTH = 64;
const CACHE_HEADER = 'public, max-age=300, s-maxage=86400';
const EMPTY_PIXEL = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
  0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 248, 255, 255, 63, 0, 5, 254, 2, 254, 13, 232, 223, 0, 0, 0, 0, 73, 69, 78,
  68, 174, 66, 96, 130,
]);

type OgVariant = 'default' | 'invited';

type OgCopy = {
  title: string;
  description: string;
};

function resolveLocale(input: string | null): SupportedLocale {
  if (!input) return DEFAULT_LOCALE;
  return locales.includes(input as SupportedLocale) ? (input as SupportedLocale) : DEFAULT_LOCALE;
}

function sanitizeParam(value: string | null, maxLength: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function resolveKey(raw: string | null, variant: OgVariant): string {
  const candidate = raw?.toLowerCase() ?? '';
  if (candidate && VALID_KEYS.has(candidate)) {
    return candidate;
  }
  return variant === 'invited' ? 'home-invited' : FALLBACK_KEY;
}

function safeToken(name: string): string {
  const value = (tokens as Record<string, string | undefined>)[name];
  if (!value) {
    throw new Error(`Token ${name} is not defined in the design system bundle.`);
  }
  return value;
}

function pxToken(name: string, multiplier = 1): string {
  const raw = Number(safeToken(name));
  if (Number.isNaN(raw)) {
    throw new Error(`Token ${name} cannot be coerced to a number.`);
  }
  return `${raw * multiplier}px`;
}

function fontWeight(name: string): number {
  return Number(safeToken(name));
}

async function resolveCopy(
  locale: SupportedLocale,
  variant: OgVariant,
  fallbackTitle: string,
  fallbackDescription: string,
): Promise<OgCopy> {
  try {
    const messages = (await loadMessages(locale)) as Record<string, unknown>;
    const og = (messages.og ?? {}) as Record<string, unknown>;
    const variantKey = variant === 'invited' ? 'invited' : 'default';
    const block = (og[variantKey] ?? og.default) as Record<string, unknown> | undefined;

    const title = typeof block?.title === 'string' ? block.title : fallbackTitle;
    const description = typeof block?.description === 'string' ? block.description : fallbackDescription;
    return { title, description };
  } catch {
    return { title: fallbackTitle, description: fallbackDescription };
  }
}

async function serveStaticFallback(
  locale: SupportedLocale,
  key: string,
  request: Request,
  triedDefault = false,
): Promise<Response> {
  const fallbackPath = getStaticOg(locale, key);
  const fallbackUrl = new URL(fallbackPath, request.url);
  try {
    const response = await fetch(fallbackUrl);
    if (!response.ok) {
      throw new Error(`Fallback fetch returned ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', CACHE_HEADER);
    headers.set('Content-Type', response.headers.get('Content-Type') ?? contentType);
    return new Response(buffer, { status: 200, headers });
  } catch {
    if (!triedDefault && (locale !== DEFAULT_LOCALE || key !== FALLBACK_KEY)) {
      return serveStaticFallback(DEFAULT_LOCALE, FALLBACK_KEY, request, true);
    }
    return new Response(EMPTY_PIXEL.slice(), {
      status: 200,
      headers: {
        'Cache-Control': CACHE_HEADER,
        'Content-Type': contentType,
      },
    });
  }
}

type RenderOptions = OgCopy;

function renderOg({ title, description }: RenderOptions) {
  const gradientStart = safeToken('--color-brand-teal');
  const gradientEnd = safeToken('--color-brand-mint');
  const accent = safeToken('--color-brand-coral');
  const textPrimary = safeToken('--semantic-color-text-inverse');
  const textMuted = safeToken('--semantic-color-text-muted');
  const sans = safeToken('--typography-fontFamily-sans');
  const emoji = safeToken('--typography-fontFamily-emoji');
  const headingSize = pxToken('--typography-size-3xl', 2.5);
  const bodySize = pxToken('--typography-size-lg', 1.2);
  const badgeSize = pxToken('--spacing-sm', 2);
  const padding = pxToken('--spacing-xxxl');
  const gapLarge = pxToken('--spacing-xl');
  const gapSmall = pxToken('--spacing-md');
  const footerSize = pxToken('--typography-size-md', 1.1);
  const headingWeight = fontWeight('--typography-weight-bold');
  const bodyWeight = fontWeight('--typography-weight-medium');
  const labelWeight = fontWeight('--typography-weight-semibold');
  const letterSpacingTight = Number(safeToken('--typography-letterSpacing-tight'));
  const lineHeightTight = Number(safeToken('--typography-lineHeight-tight'));
  const lineHeightNormal = Number(safeToken('--typography-lineHeight-normal'));

  return createElement(
    'div',
    {
      style: {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding,
        background: `linear-gradient(140deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
        color: textPrimary,
        fontFamily: `${sans}, ${emoji}`,
      },
    },
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: gapSmall,
          fontSize: bodySize,
          fontWeight: labelWeight,
          letterSpacing: `${letterSpacingTight}em`,
        },
      },
      createElement('div', {
        style: {
          width: badgeSize,
          height: badgeSize,
          borderRadius: '50%',
          backgroundColor: accent,
        },
      }),
      createElement('span', undefined, SITE_NAME),
    ),
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: gapLarge,
          maxWidth: '100%',
        },
      },
      createElement(
        'h1',
        {
          style: {
            margin: 0,
            fontSize: headingSize,
            fontWeight: headingWeight,
            lineHeight: lineHeightTight,
            letterSpacing: `${letterSpacingTight}em`,
          },
        },
        title,
      ),
      createElement(
        'p',
        {
          style: {
            margin: 0,
            fontSize: bodySize,
            fontWeight: bodyWeight,
            lineHeight: lineHeightNormal,
            color: textMuted,
            maxWidth: '100%',
          },
        },
        description,
      ),
    ),
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: footerSize,
          fontWeight: bodyWeight,
        },
      },
      createElement('span', undefined, 'louhen.com'),
      createElement('span', undefined, LEGAL_ENTITY),
    ),
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get('locale'));
  const ref = sanitizeParam(url.searchParams.get('ref'), MAX_REF_LENGTH);
  const variant: OgVariant = ref ? 'invited' : 'default';
  const key = resolveKey(url.searchParams.get('key') ?? url.searchParams.get('surface'), variant);
  const fallbackTitle = sanitizeParam(url.searchParams.get('title'), MAX_TEXT_LENGTH) ?? FALLBACK_TITLE;
  const fallbackDescription =
    sanitizeParam(url.searchParams.get('description'), MAX_TEXT_LENGTH) ?? FALLBACK_DESCRIPTION;

  const { OG_DYNAMIC_ENABLED } = getFlags({ request });
  if (!OG_DYNAMIC_ENABLED) {
    return serveStaticFallback(locale, key, request);
  }

  try {
    const copy = await resolveCopy(locale, variant, fallbackTitle, fallbackDescription);
    return new ImageResponse(renderOg(copy), {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      headers: {
        'Cache-Control': CACHE_HEADER,
        'Content-Type': contentType,
      },
    });
  } catch {
    return serveStaticFallback(locale, key, request);
  }
}
