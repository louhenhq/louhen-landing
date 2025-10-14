#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.resolve(rootDir, '../messages');
const manifestDir = path.resolve(rootDir, '../i18n-required');

const forbiddenPatterns = [
  '\\$begin:math:display\\$DE\\$end:math:display\\$',
  '\\$begin:math:display\\$EN\\$end:math:display\\$',
  'TODO:',
  '__PLACEHOLDER__',
];

let hasError = false;

function parseArgs(argv) {
  const args = {
    namespaces: null,
    coverageOnly: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--coverage-only') {
      args.coverageOnly = true;
    } else if (token === '--ns' || token === '--only') {
      const next = argv[i + 1];
      if (!next) {
        console.error(`[i18n] Expected comma-separated namespaces after ${token}`);
        hasError = true;
        break;
      }
      args.namespaces = next.split(',').map((value) => value.trim()).filter(Boolean);
      i += 1;
    } else if (token.startsWith('--ns=') || token.startsWith('--only=')) {
      const list = token.split('=').slice(1).join('=');
      args.namespaces = list.split(',').map((value) => value.trim()).filter(Boolean);
    }
  }

  if (Array.isArray(args.namespaces) && args.namespaces.length === 0) {
    args.namespaces = null;
  }

  return args;
}

const { namespaces: namespaceFilter, coverageOnly } = parseArgs(process.argv.slice(2));

async function collectJsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(entryPath);
    }
  }
  return files;
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasPath(record, keyPath, strict = true) {
  let current = record;
  for (const segment of keyPath.split('.')) {
    if (isRecord(current) && segment in current) {
      current = current[segment];
    } else if (!strict && isRecord(current) && segment in current === false) {
      return false;
    } else {
      return false;
    }
  }
  return true;
}

async function loadJsonIfExists(filePath) {
  return readFile(filePath, 'utf8')
    .then((raw) => JSON.parse(raw))
    .catch(() => null);
}

async function discoverLocales() {
  const entries = await readdir(messagesDir, { withFileTypes: true });
  const locales = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      locales.push(entry.name);
    }
  }
  return locales.sort((a, b) => a.localeCompare(b, 'en'));
}

const locales = await discoverLocales();

async function checkForbiddenTokens() {
  const jsonFiles = await collectJsonFiles(messagesDir);
  for (const filePath of jsonFiles) {
    const contents = await readFile(filePath, 'utf8');
    for (const token of forbiddenPatterns) {
      if (contents.includes(token)) {
        console.error(`Placeholder token "${token}" found in ${filePath}`);
        hasError = true;
      }
    }
  }
}

function loadManifests() {
  const manifests = new Map();
  return readdir(manifestDir)
    .then((files) => Promise.all(files
      .filter((file) => file.endsWith('.json'))
      .map(async (file) => {
        try {
          const raw = await readFile(path.join(manifestDir, file), 'utf8');
          const parsed = JSON.parse(raw);
          const keys = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.keys)
              ? parsed.keys
              : [];
          const filtered = keys.filter((value) => typeof value === 'string' && value.trim().length > 0);
          manifests.set(file.slice(0, -'.json'.length), filtered);
        } catch (error) {
          console.error(`[i18n] Failed to read manifest ${file}`, error);
          hasError = true;
        }
      })))
    .then(() => manifests)
    .catch((error) => {
      console.error(`[i18n] Unable to read manifest directory ${manifestDir}`, error);
      hasError = true;
      return manifests;
    });
}

function filterManifests(manifests, requestedNamespaces) {
  if (!Array.isArray(requestedNamespaces)) {
    return;
  }
  const requested = new Set(requestedNamespaces);
  for (const name of requestedNamespaces) {
    if (!manifests.has(name)) {
      console.warn(`[i18n] Namespace "${name}" not found in manifest list; skipping.`);
    }
  }
  for (const key of Array.from(manifests.keys())) {
    if (!requested.has(key)) {
      manifests.delete(key);
    }
  }
}

function formatCoverageTable(namespace, rows, total) {
  console.log(`Coverage (${namespace})`);
  console.log('locale       present  missing  total  coverage%');
  for (const row of rows) {
    const coverage = total > 0 ? ((row.present / total) * 100).toFixed(1) : '0.0';
    const localeLabel = row.locale.padEnd(12, ' ');
    const presentLabel = String(row.present).padStart(7, ' ');
    const missingLabel = String(row.missing).padStart(8, ' ');
    const totalLabel = String(total).padStart(6, ' ');
    const coverageLabel = coverage.padStart(9, ' ');
    console.log(`${localeLabel}${presentLabel}${missingLabel}${totalLabel}${coverageLabel}`);
  }
  console.log('');
}

await checkForbiddenTokens();

const manifests = await loadManifests();

if (manifests.size === 0) {
  console.error('[i18n] No manifest files found. Run npm run update:i18n-manifest before validating.');
  process.exit(1);
}

filterManifests(manifests, namespaceFilter);

if (manifests.size === 0) {
  if (Array.isArray(namespaceFilter)) {
    console.log('[i18n] No matching namespaces to validate; skipping.');
    process.exit(0);
  }
  console.error('[i18n] No namespaces available for validation.');
  process.exit(1);
}

const canonicalCache = new Map();
async function loadCanonical(namespace) {
  if (canonicalCache.has(namespace)) {
    return canonicalCache.get(namespace);
  }
  const filePath = path.join(messagesDir, 'en', `${namespace}.json`);
  const data = await loadJsonIfExists(filePath);
  canonicalCache.set(namespace, data);
  return data;
}

if (!coverageOnly) {
  for (const [namespace, keys] of manifests) {
    const filePath = path.join(messagesDir, 'en', `${namespace}.json`);
    try {
      const fileInfo = await stat(filePath);
      if (!fileInfo.isFile()) {
        console.error(`[i18n] Missing canonical file messages/en/${namespace}.json`);
        hasError = true;
        continue;
      }
    } catch {
      console.error(`[i18n] Missing canonical file messages/en/${namespace}.json`);
      hasError = true;
      continue;
    }

    const data = await loadCanonical(namespace);
    if (!data) {
      console.error(`[i18n] Unable to parse messages/en/${namespace}.json`);
      hasError = true;
      continue;
    }
    for (const key of keys) {
      if (!hasPath(data, key)) {
        console.error(`[i18n] Missing key "${key}" in messages/en/${namespace}.json`);
        hasError = true;
      }
    }
  }
}

for (const [namespace, keys] of manifests) {
  const total = keys.length;
  const rows = [];
  for (const locale of locales) {
    const filePath = path.join(messagesDir, locale, `${namespace}.json`);
    const data = await loadJsonIfExists(filePath);
    if (!data) {
      rows.push({ locale, present: 0, missing: total });
      continue;
    }
    let present = 0;
    for (const key of keys) {
      if (hasPath(data, key, false)) {
        present += 1;
      }
    }
    rows.push({ locale, present, missing: total - present });
  }
  formatCoverageTable(namespace, rows, total);
}

if (!coverageOnly && hasError) {
  process.exit(1);
}
