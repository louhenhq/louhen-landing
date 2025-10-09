import { getFlags, getSiteOrigin } from '@/lib/shared/flags';
import { getStaticOgUrl } from '@/lib/shared/og/fallback';

const OG_ROUTE_PATH = '/opengraph-image';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB budget

type OgUrlParams = Record<string, string | number | boolean | null | undefined>;

export type OgUrlOptions = {
  locale: string;
  key: string;
  title?: string | null;
  description?: string | null;
  params?: OgUrlParams;
};

function serializeParams(params: OgUrlParams = {}): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    search.set(key, String(value));
  }
  return search;
}

export function getOgUrl({ locale, key, title, description, params }: OgUrlOptions): string {
  const search = serializeParams(params);
  search.set('locale', locale);
  search.set('key', key);
  if (title) search.set('title', title);
  if (description) search.set('description', description);
  const origin = getSiteOrigin();
  return `${origin}${OG_ROUTE_PATH}?${search.toString()}`;
}

export function getOgImageUrl(options: OgUrlOptions): string {
  if (!getFlags().OG_DYNAMIC_ENABLED) {
    return getStaticOgUrl(options.locale, options.key);
  }
  return getOgUrl(options);
}

export function getOgImageEntry(options: OgUrlOptions): { url: string; width: number; height: number } {
  return {
    url: getOgImageUrl(options),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
  };
}

export function getOgRoutePath(): string {
  return OG_ROUTE_PATH;
}
