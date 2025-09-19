import semantic from '@louhen/design-tokens/build/web/tokens.json' assert { type: 'json' };

const tokens = semantic as Record<string, string>;

const resolve = (name: string, fallback: string) => tokens[name] ?? fallback;

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
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

const neutrals = {
  cloud: resolve('--color-neutral-cloud', 'rgb(245, 245, 245)'),
  paper: resolve('--color-neutral-paper', 'rgb(255, 255, 255)'),
  ink: resolve('--color-neutral-ink', 'rgb(17, 24, 39)'),
};

const outline = resolve('--color-light-outline', 'rgb(184, 189, 198)');

export const emailTheme = {
  background: neutrals.cloud,
  text: neutrals.ink,
  card: neutrals.paper,
  mutedText: outline,
  border: outline,
  buttonBackground: neutrals.ink,
  buttonText: neutrals.paper,
  link: neutrals.ink,
  shadow: toRgba(neutrals.ink, 0.08, 'rgba(43, 45, 66, 0.08)'),
} as const;

export type EmailTheme = typeof emailTheme;
