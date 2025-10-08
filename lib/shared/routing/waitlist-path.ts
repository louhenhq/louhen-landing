import { defaultLocale, type SupportedLocale } from '@/next-intl.locales';

export function waitlistLandingPath(): string {
  return '/waitlist';
}

export function waitlistConfirmPath(locale: SupportedLocale): string {
  return locale === defaultLocale ? '/waitlist/confirm' : `/${locale}/confirm`;
}

export function waitlistConfirmPendingPath(locale: SupportedLocale): string {
  return locale === defaultLocale ? '/waitlist/confirm-pending' : `/${locale}/confirm-pending`;
}
