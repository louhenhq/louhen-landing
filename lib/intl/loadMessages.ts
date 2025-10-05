import type { AbstractIntlMessages } from 'next-intl';
import type { SupportedLocale } from '@/next-intl.locales';

type MessagesRecord = Record<string, unknown>;

type LocaleImporter = () => Promise<MessagesRecord>;

const IMPORTERS: Partial<Record<SupportedLocale, LocaleImporter>> = {
  en: async () => (await import('@/messages/en.json')).default as MessagesRecord,
  de: async () => (await import('@/messages/de.json')).default as MessagesRecord,
  'en-de': async () => (await import('@/messages/en-de.json')).default as MessagesRecord,
  'de-de': async () => (await import('@/messages/de-de.json')).default as MessagesRecord,
};

const FALLBACK_CHAINS: Record<SupportedLocale, SupportedLocale[]> = {
  en: [],
  de: [],
  'en-de': ['en'],
  'de-de': ['de'],
  'de-at': ['de-de', 'de'],
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

async function loadLocaleMessages(locale: SupportedLocale): Promise<MessagesRecord | null> {
  const importer = IMPORTERS[locale];
  if (!importer) {
    return null;
  }
  try {
    const mod = await importer();
    return isRecord(mod) ? mod : null;
  } catch {
    return null;
  }
}

export async function loadMessages(locale: SupportedLocale): Promise<AbstractIntlMessages> {
  const fallbacks = FALLBACK_CHAINS[locale] ?? [];
  const chain: SupportedLocale[] = [...fallbacks, locale];
  const messagesList = await Promise.all(chain.map((entry) => loadLocaleMessages(entry)));

  const merged = messagesList.reduce<MessagesRecord>((acc, current) => {
    if (!current) {
      return acc;
    }
    return deepMerge(acc, current);
  }, {});

  return merged as AbstractIntlMessages;
}
