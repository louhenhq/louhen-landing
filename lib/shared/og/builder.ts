import { isDynamicOgEnabled } from '@/lib/env/media';
import { getSiteOrigin } from '@/lib/env/site-origin';

const OG_ROUTE_PATH = '/opengraph-image';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 2 MB budget

type OgBuilderOptions = {
  locale: string;
  surface: string;
  title?: string | null;
  description?: string | null;
  params?: Record<string, string | number | boolean | null | undefined>;
};

function serialiseParams(params: Record<string, string | number | boolean | null | undefined> = {}): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    searchParams.set(key, String(value));
  }
  return searchParams;
}

/**
 * Builds a fully-qualified OG image URL targeting the dynamic renderer.
 */
export function buildOgImageUrl({ locale, surface, title, description, params }: OgBuilderOptions): string {
  const base = `${getSiteOrigin()}${OG_ROUTE_PATH}`;
  const search = serialiseParams(params);
  search.set('locale', locale);
  search.set('surface', surface);
  if (title) search.set('title', title);
  if (description) search.set('description', description);
  return `${base}?${search.toString()}`;
}

/**
 * Returns a relative path to the static OG fallback image.
 */
export function getStaticOg(locale: string, key: string): string {
  return `/og/${locale}/${key}.png`;
}

export function buildStaticOgUrl(locale: string, key: string): string {
  return `${getSiteOrigin()}${getStaticOg(locale, key)}`;
}

export function getOgRoutePath(): string {
  return OG_ROUTE_PATH;
}

type OgImageResolverOptions = {
  locale: string;
  surface: string;
  title: string;
  description: string;
  params?: Record<string, string | number | boolean | null | undefined>;
};

export function resolveOgImageUrl(options: OgImageResolverOptions): string {
  if (!isDynamicOgEnabled()) {
    return buildStaticOgUrl(options.locale, options.surface);
  }
  return buildOgImageUrl(options);
}

export function buildOgImageEntry(options: OgImageResolverOptions): { url: string; width: number; height: number } {
  const url = resolveOgImageUrl(options);
  return { url, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT };
}
