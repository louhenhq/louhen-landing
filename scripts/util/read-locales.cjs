const fs = require('node:fs');
const path = require('node:path');

const LOCALE_PATTERN = /^[a-z]{2}(?:-[a-z]{2})?$/i;
const DEFAULT_LOCALE_FALLBACK = 'de-de';
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const MESSAGES_DIR = path.join(ROOT_DIR, 'messages');

function normalizeLocale(value) {
  if (!value) return null;
  const trimmed = String(value).trim().toLowerCase();
  if (!trimmed) return null;
  return LOCALE_PATTERN.test(trimmed) ? trimmed : null;
}

function unique(list) {
  return Array.from(new Set(list));
}

function sortLocales(list) {
  return [...list].sort((a, b) => {
    const aMarket = a.includes('-') ? 0 : 1;
    const bMarket = b.includes('-') ? 0 : 1;
    if (aMarket !== bMarket) return aMarket - bMarket;
    return a.localeCompare(b);
  });
}

function parseLocaleList(raw) {
  if (!raw) return [];
  return unique(
    raw
      .split(',')
      .map((part) => normalizeLocale(part))
      .filter(Boolean),
  );
}

function discoverLocalesFromMessages() {
  try {
    const entries = fs.readdirSync(MESSAGES_DIR, { withFileTypes: true });
    const locales = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => normalizeLocale(entry.name))
      .filter(Boolean);
    return unique(sortLocales(locales));
  } catch {
    return [];
  }
}

const envLocales = parseLocaleList(process.env.LH_LOCALES);
const discoveredLocales = envLocales.length ? envLocales : discoverLocalesFromMessages();
let locales = unique(sortLocales(discoveredLocales));
if (!locales.length) {
  locales = [DEFAULT_LOCALE_FALLBACK];
}

const defaultCandidates = unique(
  [
    normalizeLocale(process.env.LH_DEFAULT_LOCALE),
    normalizeLocale(process.env.NEXT_PUBLIC_DEFAULT_LOCALE),
    locales[0],
    DEFAULT_LOCALE_FALLBACK,
  ].filter(Boolean),
);

let defaultLocale = defaultCandidates.find((candidate) => locales.includes(candidate)) ?? defaultCandidates[0];
if (!defaultLocale) {
  defaultLocale = DEFAULT_LOCALE_FALLBACK;
}

locales = unique([defaultLocale, ...locales]);

const result = {
  locales,
  defaultLocale,
};

module.exports = result;

if (require.main === module) {
  console.log(JSON.stringify(result, null, 2));
}
