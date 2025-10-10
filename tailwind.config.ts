import tokensJson from './packages/design-tokens/build/web/tokens.json' assert { type: 'json' }
import type { Config } from 'tailwindcss'

type NestedRecord = Record<string, string | NestedRecord>

const tokens = tokensJson as Record<string, string>

const normalizeTokenName = (name: string) => name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)

const cssVar = (name: string) => `var(${normalizeTokenName(name)})`
const remFromToken = (name: string) => `calc(var(${normalizeTokenName(name)}) / 16 * 1rem)`
const pxFromToken = (name: string) => `calc(var(${normalizeTokenName(name)}) * 1px)`

const slugify = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .replace(/\.+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()

const assignNested = (target: NestedRecord, segments: string[], value: string) => {
  if (segments.length === 0) return
  const [head, ...rest] = segments
  if (rest.length === 0) {
    target[head] = value
    return
  }
  if (typeof target[head] !== 'object' || target[head] === null || Array.isArray(target[head])) {
    target[head] = {}
  }
  assignNested(target[head] as NestedRecord, rest, value)
}

const buildColorTokens = () => {
  const tree: NestedRecord = {}
  const prefixes: Array<{ match: string; segments: (parts: string[]) => string[] }> = [
    {
      match: '--color-',
      segments: (parts) => parts.slice(1),
    },
    {
      match: '--semantic-color-',
      segments: (parts) => ['semantic', ...parts.slice(2)],
    },
    {
      match: '--semanticDark-color-',
      segments: (parts) => ['semantic-dark', ...parts.slice(3)],
    },
    {
      match: '--semanticHc-color-',
      segments: (parts) => ['semantic-hc', ...parts.slice(3)],
    },
  ]

  for (const key of Object.keys(tokens)) {
    const prefixEntry = prefixes.find(({ match }) => key.startsWith(match))
    if (!prefixEntry) continue

    const value = tokens[key]
    if (typeof value !== 'string' || value.includes('[object Object]')) continue

    const normalized = normalizeTokenName(key).replace(/^--/, '')
    const parts = normalized.split('-').filter(Boolean)
    const segments = prefixEntry.segments(parts)
    if (segments.length === 0) continue

    assignNested(tree, segments, cssVar(key))
  }

  return tree
}

const buildSpacingTokens = () =>
  Object.fromEntries(
    Object.keys(tokens)
      .filter((key) => key.startsWith('--spacing-'))
      .map((key) => [slugify(key.replace('--spacing-', '')), remFromToken(key)]),
  )

const buildRadiusTokens = () =>
  Object.fromEntries(
    Object.keys(tokens)
      .filter((key) => key.startsWith('--radii-'))
      .map((key) => [slugify(key.replace('--radii-', '')), pxFromToken(key)]),
  )

const buildFontSizeTokens = () =>
  Object.fromEntries(
    Object.keys(tokens)
      .filter((key) => key.startsWith('--typography-size-'))
      .map((key) => [slugify(key.replace('--typography-size-', '')), remFromToken(key)]),
  )

const buildBoxShadowTokens = () => {
  const scale: Record<string, string> = {}
  for (const key of Object.keys(tokens)) {
    if (!key.startsWith('--elevation-level')) continue
    const suffix = key.replace('--elevation-', '')
    const slug = slugify(suffix)
    const offset = pxFromToken(key)
    const blur = `calc(var(${normalizeTokenName(key)}) * 2px)`
    scale[slug] = `0 ${offset} ${blur} 0 var(--color-light-shadow)`
    scale[`dark-${slug}`] = `0 ${offset} ${blur} 0 var(--color-dark-shadow)`
  }
  return scale
}

const config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './components/features/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: buildColorTokens(),
      spacing: buildSpacingTokens(),
      borderRadius: buildRadiusTokens(),
      fontSize: buildFontSizeTokens(),
      boxShadow: buildBoxShadowTokens(),
    },
  },
  plugins: [],
} satisfies Config

export default config
