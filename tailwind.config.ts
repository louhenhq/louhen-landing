/* CODEx: map design tokens into Tailwind theme via CSS variables */
import type { Config } from 'tailwindcss'

const withVar = (name: string) => `var(${name})`

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // semantic palettes (light/dark/hc come from :root data-attrs)
        bg: {
          DEFAULT: withVar('--semantic-color-bg-page'),
          card: withVar('--semantic-color-bg-card'),
          raised: withVar('--semantic-color-bg-raised'),
          overlay: withVar('--semantic-color-bg-overlay'),
        },
        text: {
          DEFAULT: withVar('--semantic-color-text-body'),
          muted: withVar('--semantic-color-text-muted'),
          inverse: withVar('--semantic-color-text-inverse'),
          link: withVar('--semantic-color-text-link'),
        },
        border: {
          DEFAULT: withVar('--semantic-color-border-subtle'),
          strong: withVar('--semantic-color-border-strong'),
          focus: withVar('--semantic-color-border-focus'),
        },
        status: {
          success: withVar('--semantic-color-status-success'),
          warning: withVar('--semantic-color-status-warning'),
          info: withVar('--semantic-color-status-info'),
          danger: withVar('--semantic-color-status-danger'),
        },
        brand: {
          primary: withVar('--color-light-primary'),
          secondary: withVar('--color-light-secondary'),
          coral: withVar('--color-brand-coral'),
          mint: withVar('--color-brand-mint'),
          teal: withVar('--color-brand-teal'),
        },
      },
      spacing: {
        xs: withVar('--spacing-xs'),
        sm: withVar('--spacing-sm'),
        md: withVar('--spacing-md'),
        lg: withVar('--spacing-lg'),
        xl: withVar('--spacing-xl'),
        '2xl': withVar('--spacing-xxl'),
        '3xl': withVar('--spacing-xxxl'),
        gutter: withVar('--spacing-gutter'),
      },
      borderRadius: {
        sm: withVar('--radii-sm'),
        md: withVar('--radii-md'),
        lg: withVar('--radii-lg'),
        pill: withVar('--radii-pill'),
      },
      zIndex: {
        header: 'var(--z-index-header)',
        modal: 'var(--z-index-modal)',
        toast: 'var(--z-index-toast)',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.08)',
      },
      transitionDuration: {
        fast: 'var(--motion-dur-fast)',
        base: 'var(--motion-dur-normal)',
        slow: 'var(--motion-dur-slow)',
      },
      letterSpacing: {
        tight: 'var(--typography-letter-spacing-tight)',
        wide: 'var(--typography-letter-spacing-wide)',
      },
    },
  },
  plugins: [],
} satisfies Config
