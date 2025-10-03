import { emailColors, emailColorsDark } from '@/lib/email/colors';

const FALLBACK_SHADOW = 'rgba(43, 45, 66, 0.08)';

export type EmailPalette = Readonly<{
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  link: string;
  badge: string;
  badgeText: string;
  success: string;
  warning: string;
  error: string;
}>; 

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) return null;
  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const toRgba = (hex: string | undefined, alpha: number, fallback: string) => {
  if (!hex) return fallback;
  const rgb = hexToRgb(hex);
  if (!rgb) return fallback;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

export type EmailTheme = {
  background: string;
  text: string;
  card: string;
  mutedText: string;
  border: string;
  buttonBackground: string;
  buttonText: string;
  link: string;
  shadow: string;
};

export function buildEmailTheme(palette: EmailPalette): EmailTheme {
  return {
    background: palette.background,
    text: palette.text,
    card: palette.surface,
    mutedText: palette.muted,
    border: palette.border,
    buttonBackground: palette.badge,
    buttonText: palette.badgeText,
    link: palette.link,
    shadow: toRgba(palette.text, 0.08, FALLBACK_SHADOW),
  };
}

export const emailTheme = buildEmailTheme(emailColors);

export const emailThemeDark = buildEmailTheme(emailColorsDark);
