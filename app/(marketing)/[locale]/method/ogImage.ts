import type { SupportedLocale } from '@/next-intl.locales';

function truncate(value: string, length: number): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1).trimEnd()}…`;
}

export function buildMethodOgImageUrl(baseUrl: string, locale: SupportedLocale, title: string, description: string): string {
  const url = new URL('/opengraph-image', baseUrl);
  url.searchParams.set('locale', locale);
  url.searchParams.set('title', truncate(title, 120));
  url.searchParams.set('description', truncate(description, 200));
  url.searchParams.set('source', 'method');
  return url.toString();
}
