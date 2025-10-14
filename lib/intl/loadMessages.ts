import type { AbstractIntlMessages } from 'next-intl';
import type { SupportedLocale } from '@/next-intl.locales';

type BaseLanguage = 'de' | 'en' | 'fr' | 'nl' | 'it';
type LocaleKey = SupportedLocale | BaseLanguage;
type MessagesRecord = Record<string, unknown>;
type LocaleImporter = () => Promise<MessagesRecord>;

const ALL_NAMESPACES = [
  'common',
  'home',
  'waitlist',
  'method',
  'legal',
  'imprint',
  'status',
  'errors',
  'sitemap',
] as const;

type Namespace = (typeof ALL_NAMESPACES)[number];

const NAMESPACE_IMPORTERS: Record<Namespace, Partial<Record<LocaleKey, LocaleImporter>>> = {
  common: {
    en: async () => (await import('@/messages/en/common.json')).default as MessagesRecord,
    de: async () => (await import('@/messages/de/common.json')).default as MessagesRecord,
    fr: async () => (await import('@/messages/fr/common.json')).default as MessagesRecord,
    nl: async () => (await import('@/messages/nl/common.json')).default as MessagesRecord,
    it: async () => (await import('@/messages/it/common.json')).default as MessagesRecord,
    'de-de': async () => (await import('@/messages/de-de/common.json')).default as MessagesRecord,
    'en-de': async () => (await import('@/messages/en-de/common.json')).default as MessagesRecord,
    'fr-fr': async () => (await import('@/messages/fr-fr/common.json')).default as MessagesRecord,
    'nl-nl': async () => (await import('@/messages/nl-nl/common.json')).default as MessagesRecord,
    'it-it': async () => (await import('@/messages/it-it/common.json')).default as MessagesRecord,
  },
  home: {
    en: async () => (await import('@/messages/en/home.json')).default as MessagesRecord,
    de: async () => (await import('@/messages/de/home.json')).default as MessagesRecord,
    fr: async () => (await import('@/messages/fr/home.json')).default as MessagesRecord,
    nl: async () => (await import('@/messages/nl/home.json')).default as MessagesRecord,
    it: async () => (await import('@/messages/it/home.json')).default as MessagesRecord,
    'de-de': async () => (await import('@/messages/de-de/home.json')).default as MessagesRecord,
    'en-de': async () => (await import('@/messages/en-de/home.json')).default as MessagesRecord,
    'fr-fr': async () => (await import('@/messages/fr-fr/home.json')).default as MessagesRecord,
    'nl-nl': async () => (await import('@/messages/nl-nl/home.json')).default as MessagesRecord,
    'it-it': async () => (await import('@/messages/it-it/home.json')).default as MessagesRecord,
  },
  waitlist: {
    en: async () => (await import('@/messages/en/waitlist.json')).default as MessagesRecord,
    de: async () => (await import('@/messages/de/waitlist.json')).default as MessagesRecord,
    fr: async () => (await import('@/messages/fr/waitlist.json')).default as MessagesRecord,
    nl: async () => (await import('@/messages/nl/waitlist.json')).default as MessagesRecord,
    it: async () => (await import('@/messages/it/waitlist.json')).default as MessagesRecord,
    'de-de': async () => (await import('@/messages/de-de/waitlist.json')).default as MessagesRecord,
    'en-de': async () => (await import('@/messages/en-de/waitlist.json')).default as MessagesRecord,
    'fr-fr': async () => (await import('@/messages/fr-fr/waitlist.json')).default as MessagesRecord,
    'nl-nl': async () => (await import('@/messages/nl-nl/waitlist.json')).default as MessagesRecord,
    'it-it': async () => (await import('@/messages/it-it/waitlist.json')).default as MessagesRecord,
  },
  method: {
    en: async () => (await import('@/messages/en/method.json')).default as MessagesRecord,
    de: async () => (await import('@/messages/de/method.json')).default as MessagesRecord,
    fr: async () => (await import('@/messages/fr/method.json')).default as MessagesRecord,
    nl: async () => (await import('@/messages/nl/method.json')).default as MessagesRecord,
    it: async () => (await import('@/messages/it/method.json')).default as MessagesRecord,
    'de-de': async () => (await import('@/messages/de-de/method.json')).default as MessagesRecord,
    'en-de': async () => (await import('@/messages/en-de/method.json')).default as MessagesRecord,
    'fr-fr': async () => (await import('@/messages/fr-fr/method.json')).default as MessagesRecord,
    'nl-nl': async () => (await import('@/messages/nl-nl/method.json')).default as MessagesRecord,
    'it-it': async () => (await import('@/messages/it-it/method.json')).default as MessagesRecord,
  },
  legal: {
    en: async () => (await import('@/messages/en/legal.json')).default as MessagesRecord,
    de: async () => (await import('@/messages/de/legal.json')).default as MessagesRecord,
    fr: async () => (await import('@/messages/fr/legal.json')).default as MessagesRecord,
    nl: async () => (await import('@/messages/nl/legal.json')).default as MessagesRecord,
    it: async () => (await import('@/messages/it/legal.json')).default as MessagesRecord,
    'de-de': async () => (await import('@/messages/de-de/legal.json')).default as MessagesRecord,
    'en-de': async () => (await import('@/messages/en-de/legal.json')).default as MessagesRecord,
    'fr-fr': async () => (await import('@/messages/fr-fr/legal.json')).default as MessagesRecord,
    'nl-nl': async () => (await import('@/messages/nl-nl/legal.json')).default as MessagesRecord,
    'it-it': async () => (await import('@/messages/it-it/legal.json')).default as MessagesRecord,
  },
  imprint: {
    en: async () => (await import('@/messages/en/imprint.json')).default as MessagesRecord,
    de: async () => (await import('@/messages/de/imprint.json')).default as MessagesRecord,
    fr: async () => (await import('@/messages/fr/imprint.json')).default as MessagesRecord,
    nl: async () => (await import('@/messages/nl/imprint.json')).default as MessagesRecord,
    it: async () => (await import('@/messages/it/imprint.json')).default as MessagesRecord,
    'de-de': async () => (await import('@/messages/de-de/imprint.json')).default as MessagesRecord,
    'en-de': async () => (await import('@/messages/en-de/imprint.json')).default as MessagesRecord,
    'fr-fr': async () => (await import('@/messages/fr-fr/imprint.json')).default as MessagesRecord,
    'nl-nl': async () => (await import('@/messages/nl-nl/imprint.json')).default as MessagesRecord,
    'it-it': async () => (await import('@/messages/it-it/imprint.json')).default as MessagesRecord,
  },
  status: {
    en: async () => (await import('@/messages/en/status.json')).default as MessagesRecord,
    de: async () => (await import('@/messages/de/status.json')).default as MessagesRecord,
    fr: async () => (await import('@/messages/fr/status.json')).default as MessagesRecord,
    nl: async () => (await import('@/messages/nl/status.json')).default as MessagesRecord,
    it: async () => (await import('@/messages/it/status.json')).default as MessagesRecord,
    'de-de': async () => (await import('@/messages/de-de/status.json')).default as MessagesRecord,
    'en-de': async () => (await import('@/messages/en-de/status.json')).default as MessagesRecord,
    'fr-fr': async () => (await import('@/messages/fr-fr/status.json')).default as MessagesRecord,
    'nl-nl': async () => (await import('@/messages/nl-nl/status.json')).default as MessagesRecord,
    'it-it': async () => (await import('@/messages/it-it/status.json')).default as MessagesRecord,
  },
  errors: {
    en: async () => (await import('@/messages/en/errors.json')).default as MessagesRecord,
    de: async () => (await import('@/messages/de/errors.json')).default as MessagesRecord,
    fr: async () => (await import('@/messages/fr/errors.json')).default as MessagesRecord,
    nl: async () => (await import('@/messages/nl/errors.json')).default as MessagesRecord,
    it: async () => (await import('@/messages/it/errors.json')).default as MessagesRecord,
    'de-de': async () => (await import('@/messages/de-de/errors.json')).default as MessagesRecord,
    'en-de': async () => (await import('@/messages/en-de/errors.json')).default as MessagesRecord,
    'fr-fr': async () => (await import('@/messages/fr-fr/errors.json')).default as MessagesRecord,
    'nl-nl': async () => (await import('@/messages/nl-nl/errors.json')).default as MessagesRecord,
    'it-it': async () => (await import('@/messages/it-it/errors.json')).default as MessagesRecord,
  },
  sitemap: {
    en: async () => (await import('@/messages/en/sitemap.json')).default as MessagesRecord,
    de: async () => (await import('@/messages/de/sitemap.json')).default as MessagesRecord,
    fr: async () => (await import('@/messages/fr/sitemap.json')).default as MessagesRecord,
    nl: async () => (await import('@/messages/nl/sitemap.json')).default as MessagesRecord,
    it: async () => (await import('@/messages/it/sitemap.json')).default as MessagesRecord,
    'de-de': async () => (await import('@/messages/de-de/sitemap.json')).default as MessagesRecord,
    'en-de': async () => (await import('@/messages/en-de/sitemap.json')).default as MessagesRecord,
    'fr-fr': async () => (await import('@/messages/fr-fr/sitemap.json')).default as MessagesRecord,
    'nl-nl': async () => (await import('@/messages/nl-nl/sitemap.json')).default as MessagesRecord,
    'it-it': async () => (await import('@/messages/it-it/sitemap.json')).default as MessagesRecord,
  },
};

function isRecord(value: unknown): value is MessagesRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(target: MessagesRecord, source: MessagesRecord): MessagesRecord {
  const result: MessagesRecord = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (isRecord(value) && isRecord(result[key])) {
      result[key] = deepMerge(result[key] as MessagesRecord, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

const namespaceCache = new Map<string, Promise<MessagesRecord | null>>();
const missingNamespaceWarnings = new Set<string>();

async function loadNamespace(locale: LocaleKey, namespace: Namespace): Promise<MessagesRecord | null> {
  const cacheKey = `${namespace}:${locale}`;
  if (namespaceCache.has(cacheKey)) {
    return namespaceCache.get(cacheKey)!;
  }

  const importer = NAMESPACE_IMPORTERS[namespace]?.[locale];
  if (!importer) {
    if (process.env.NODE_ENV !== 'production') {
      const warningKey = `${namespace}:${locale}:missing`;
      if (!missingNamespaceWarnings.has(warningKey)) {
        console.warn(`[intl] Namespace "${namespace}" has no bundle for "${locale}". Falling back to base layers only.`);
        missingNamespaceWarnings.add(warningKey);
      }
    }
    namespaceCache.set(cacheKey, Promise.resolve(null));
    return null;
  }

  const promise = importer().catch((error) => {
    if (process.env.NODE_ENV !== 'production') {
      const warningKey = `${namespace}:${locale}:error`;
      if (!missingNamespaceWarnings.has(warningKey)) {
        console.warn(`[intl] Failed to import messages for ${locale}/${namespace}:`, error);
        missingNamespaceWarnings.add(warningKey);
      }
    }
    return null;
  });

  namespaceCache.set(cacheKey, promise);
  return promise;
}

function splitLocale(value: LocaleKey): { language: BaseLanguage; region: string | null } {
  const [language, region] = value.split('-');
  if (language === 'en' || language === 'de' || language === 'fr' || language === 'nl' || language === 'it') {
    return { language, region: region ?? null };
  }
  return { language: 'en', region: null };
}

function buildFallbackChain(locale: SupportedLocale): LocaleKey[] {
  const { language, region } = splitLocale(locale);
  const chain: LocaleKey[] = ['en'];
  if (language !== 'en') {
    chain.push(language);
  }
  if (region) {
    chain.push(locale);
  } else if (language === 'en' && locale !== 'en') {
    chain.push(locale);
  }
  return Array.from(new Set(chain));
}

export async function loadMessages(locale: SupportedLocale): Promise<AbstractIntlMessages> {
  const chain = buildFallbackChain(locale);
  let merged: MessagesRecord = {};

  for (const namespace of ALL_NAMESPACES) {
    for (const entry of chain) {
      const chunk = await loadNamespace(entry, namespace);
      if (chunk) {
        merged = deepMerge(merged, chunk);
      }
    }
  }

  return merged as AbstractIntlMessages;
}
