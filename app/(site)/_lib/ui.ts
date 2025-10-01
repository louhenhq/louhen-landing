export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const layout = {
  shell: 'flex min-h-screen flex-col bg-bg text-text',
  page: 'min-h-screen bg-bg text-text',
  main: 'flex-1',
  container: 'mx-auto w-full max-w-[min(100%,var(--layout-max-width))] px-gutter',
  narrow: 'mx-auto w-full max-w-3xl px-gutter',
  section:
    'py-[var(--layout-section-padding-clamp)] scroll-mt-[calc(var(--layout-header-height)+var(--spacing-24))]',
  grid: 'grid gap-y-xl gap-x-gutter md:grid-cols-12',
  stackLg: 'flex flex-col gap-xl',
  stackMd: 'flex flex-col gap-lg',
  card: 'rounded-2xl border border-border bg-bg-card shadow-card',
};

export const text = {
  eyebrow: 'text-meta tracking-[0.32em] uppercase text-text-muted',
  hero: 'text-display-xl text-balance text-text',
  heading: 'text-display-lg text-balance text-text',
  subheading: 'text-body text-text-muted',
  body: 'text-body text-text',
  bodyMuted: 'text-body text-text-muted',
  label: 'text-label text-text',
  meta: 'text-meta text-text-muted',
};

export const buttons = {
  primary:
    'inline-flex items-center justify-center gap-xs rounded-pill bg-brand-primary px-lg py-sm text-label text-brand-onPrimary transition-opacity duration-base hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:cursor-not-allowed disabled:opacity-60',
  secondary:
    'inline-flex items-center justify-center gap-xs rounded-pill border border-border px-lg py-sm text-label text-text transition-colors duration-base hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:cursor-not-allowed disabled:opacity-60',
};

export const badges = {
  pill: 'inline-flex items-center gap-xs rounded-pill border border-border bg-bg-card px-sm py-xs text-body-sm font-medium text-text transition-colors duration-base hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
};

export const surfaces = {
  subtle: 'bg-[var(--semantic-color-bg-surface-subtle, var(--color-light-surface, var(--semantic-color-bg-card)))]',
};

export const shadows = {
  soft: 'shadow-card',
  elevated: 'shadow-elevated',
};

export const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus focus-visible:shadow-[var(--shadow-focus)]';

export const inputs = 'rounded-2xl border border-border bg-bg px-md py-sm text-body text-text placeholder:text-text-muted/80 transition-shadow duration-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus focus-visible:shadow-[var(--shadow-focus)]';

export const helperText = 'text-body-sm text-text-muted';
