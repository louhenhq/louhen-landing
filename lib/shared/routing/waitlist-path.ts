import type { SupportedLocale } from '@/next-intl.locales';

export function waitlistLandingPath(locale: SupportedLocale): string {
  return `/${locale}/waitlist`;
}

export function waitlistConfirmPath(locale: SupportedLocale): string {
  return `/${locale}/confirm`;
}

export function waitlistConfirmPendingPath(locale: SupportedLocale): string {
  return `/${locale}/confirm-pending`;
}
