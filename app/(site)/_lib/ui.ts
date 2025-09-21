export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const layout = {
  page: 'bg-bg text-text min-h-screen',
  container: 'mx-auto w-full max-w-6xl px-gutter',
  narrow: 'mx-auto w-full max-w-3xl px-gutter',
  section: 'py-2xl md:py-3xl',
  stackLg: 'flex flex-col gap-xl',
  stackMd: 'flex flex-col gap-lg',
  card: 'rounded-3xl border border-border bg-bg-card shadow-card',
};

export const text = {
  eyebrow: 'text-sm uppercase tracking-wide text-text-muted',
  heading: 'text-4xl md:text-5xl font-semibold leading-[1.05] tracking-tight text-balance',
  subheading: 'text-lg md:text-xl text-text-muted leading-relaxed text-balance',
  body: 'text-base text-text-muted leading-relaxed',
};

export const buttons = {
  primary: 'inline-flex items-center justify-center rounded-pill bg-brand-primary px-lg py-sm text-base font-medium text-white transition-opacity duration-base hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
  secondary: 'inline-flex items-center justify-center rounded-pill border border-border px-lg py-sm text-base font-medium text-text transition-colors duration-base hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
};

export const badges = {
  pill: 'inline-flex items-center gap-xs rounded-pill border border-border bg-bg-card px-sm py-xs text-sm font-medium text-text transition-colors duration-base hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
};

export const surfaces = {
  subtle: 'bg-[var(--semantic-color-bg-surface-subtle, var(--color-light-surface, var(--semantic-color-bg-card)))]',
};

export const shadows = {
  soft: 'shadow-[0_24px_48px_-28px_rgba(15,23,42,0.35)]',
};
