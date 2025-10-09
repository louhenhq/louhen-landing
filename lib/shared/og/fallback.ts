import { getSiteOrigin } from '@/lib/shared/url/get-site-origin';

export function getStaticOg(locale: string, key: string): string {
  return `/og/${locale}/${key}.png`;
}

export function getStaticOgUrl(locale: string, key: string): string {
  return `${getSiteOrigin()}${getStaticOg(locale, key)}`;
}
