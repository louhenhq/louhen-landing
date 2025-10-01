// GENERATED FILE - DO NOT EDIT. Generated from design tokens.
// Source: packages/design-tokens/tokens/tokens.json (email.* tokens)
export const emailColors = {
  background: '#FFFFFF',
  badge: '#1A4E5F',
  badgeText: '#F2FAFA',
  border: '#E1E8EE',
  error: '#FF6B6B',
  link: '#1A4E5F',
  muted: '#E1E8EE',
  success: '#2BB673',
  surface: '#F8F9FA',
  text: '#1F2937',
  warning: '#F4B400',
} as const;
export type EmailColorName = keyof typeof emailColors;

export const emailColorsDark = {
  background: '#0F1822',
  badge: '#A8DADC',
  badgeText: '#1A4E5F',
  border: '#3F4C5C',
  error: '#FF6B6B',
  link: '#A8DADC',
  muted: '#3F4C5C',
  success: '#2BB673',
  surface: '#15202B',
  text: '#FFFFFF',
  warning: '#F4B400',
} as const;
export type EmailColorNameDark = keyof typeof emailColorsDark;

export type EmailColorPalette = typeof emailColors;
export type EmailColorPaletteDark = typeof emailColorsDark;