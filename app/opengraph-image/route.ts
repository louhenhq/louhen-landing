import { createElement } from 'react';
import { ImageResponse } from 'next/og';
import { SITE_NAME, LEGAL_ENTITY } from '@/constants/site';
import { loadMessages } from '@/lib/intl/loadMessages';
import { locales, type SupportedLocale } from '@/next-intl.locales';
import tokens from '@louhen/design-tokens/build/web/tokens.json' assert { type: 'json' };

export const runtime = 'edge';
export const size = { width: 1200, height: 630 } as const;
export const contentType = 'image/png';

const DEFAULT_LOCALE: SupportedLocale = 'en-de';

function resolveLocale(input: string | null): SupportedLocale {
  if (!input) return DEFAULT_LOCALE;
  return locales.includes(input as SupportedLocale) ? (input as SupportedLocale) : DEFAULT_LOCALE;
}

function token(name: string): string {
  const value = (tokens as Record<string, string | undefined>)[name];
  if (!value) {
    throw new Error(`Token ${name} is not defined in the design system bundle.`);
  }
  return value;
}

function pxToken(name: string, multiplier = 1): string {
  const raw = Number(token(name));
  if (Number.isNaN(raw)) {
    throw new Error(`Token ${name} cannot be coerced to a number.`);
  }
  return `${raw * multiplier}px`;
}

function fontWeight(name: string): number {
  return Number(token(name));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get('locale'));
  const ref = url.searchParams.get('ref');
  const messages = (await loadMessages(locale)) as Record<string, unknown>;
  const og = (messages.og ?? {}) as Record<string, unknown>;
  const defaultBlock = og.default as Record<string, unknown> | undefined;
  const invitedBlock = og.invited as Record<string, unknown> | undefined;
  const block = ref ? invitedBlock : defaultBlock;

  const title = typeof block?.title === 'string' ? block.title : 'Louhen';
  const description = typeof block?.description === 'string' ? block.description : 'Tailored comfort backed by podiatrists.';

  const gradientStart = token('--color-brand-teal');
  const gradientEnd = token('--color-brand-mint');
  const accent = token('--color-brand-coral');
  const textPrimary = token('--semantic-color-text-inverse');
  const textMuted = token('--semantic-color-text-muted');
  const sans = token('--typography-fontFamily-sans');
  const emoji = token('--typography-fontFamily-emoji');
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
  const letterSpacingTight = Number(token('--typography-letterSpacing-tight'));
  const lineHeightTight = Number(token('--typography-lineHeight-tight'));
  const lineHeightNormal = Number(token('--typography-lineHeight-normal'));

  const content = createElement(
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

  return new ImageResponse(
    content,
    {
      ...size,
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    },
  );
}
