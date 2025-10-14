#!/usr/bin/env node

import { readdir, readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(rootDir, '..');

const SOURCE_DIRS = ['app', 'components', 'lib', 'tests'];
const FILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
const MANIFEST_DIR = path.resolve(projectRoot, 'i18n-required');
const EN_MESSAGES_DIR = path.resolve(projectRoot, 'messages/en');
const SAFE_GET_REGEX = /safeGetMessage\s*\(\s*[^,]+,\s*['"]([^'"]+)['"]/g;
const IGNORED_KEYS = new Set(['a.b.c']);

function isDirectoryEntrySkippable(entryName) {
  return (
    entryName.startsWith('.') ||
    entryName === 'node_modules' ||
    entryName === '.next' ||
    entryName === 'dist' ||
    entryName === 'build'
  );
}

async function collectSourceFiles(root, accumulator) {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (isDirectoryEntrySkippable(entry.name)) continue;
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await collectSourceFiles(entryPath, accumulator);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (FILE_EXTENSIONS.has(ext) && !entry.name.endsWith('.d.ts')) {
        accumulator.push(entryPath);
      }
    }
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasPath(record, keyPath) {
  let current = record;
  for (const segment of keyPath.split('.')) {
    if (isRecord(current) && segment in current) {
      current = current[segment];
    } else {
      return false;
    }
  }
  return true;
}

async function main() {
  const files = [];
  for (const dir of SOURCE_DIRS) {
    const absolute = path.resolve(projectRoot, dir);
    try {
      await collectSourceFiles(absolute, files);
    } catch (error) {
      console.error(`[i18n-manifest] Failed to traverse ${absolute}:`, error);
      process.exit(1);
    }
  }

  const discoveredKeys = new Set();

  for (const filePath of files) {
    let contents;
    try {
      contents = await readFile(filePath, 'utf8');
    } catch (error) {
      console.error(`[i18n-manifest] Failed to read ${filePath}:`, error);
      process.exit(1);
    }

    let match;
    while ((match = SAFE_GET_REGEX.exec(contents)) !== null) {
      const key = match[1]?.trim();
      if (key && !IGNORED_KEYS.has(key)) {
        discoveredKeys.add(key);
      }
    }
  }

  const namespaceData = new Map();
  let messageFiles;
  try {
    messageFiles = await readdir(EN_MESSAGES_DIR);
  } catch (error) {
    console.error(`[i18n-manifest] Unable to read messages/en directory:`, error);
    process.exit(1);
  }

  for (const file of messageFiles) {
    if (!file.endsWith('.json')) continue;
    const namespace = file.slice(0, -'.json'.length);
    try {
      const raw = await readFile(path.join(EN_MESSAGES_DIR, file), 'utf8');
      namespaceData.set(namespace, JSON.parse(raw));
    } catch (error) {
      console.error(`[i18n-manifest] Failed to parse messages/en/${file}:`, error);
      process.exit(1);
    }
  }

  const manifest = new Map();
  const unresolvedKeys = [];

  for (const key of discoveredKeys) {
    const [firstSegment] = key.split('.');
    const candidates = [];
    for (const [namespace, data] of namespaceData) {
      if (isRecord(data) && firstSegment && firstSegment in data) {
        candidates.push(namespace);
      }
    }

    let targetNamespace = null;
    if (candidates.length === 1) {
      targetNamespace = candidates[0];
    } else if (candidates.length > 1) {
      targetNamespace = candidates[0];
      console.warn(
        `[i18n-manifest] Key "${key}" matched multiple namespaces (${candidates.join(
          ', '
        )}); defaulting to "${targetNamespace}".`
      );
    } else if (firstSegment && namespaceData.has(firstSegment)) {
      targetNamespace = firstSegment;
    }

    if (!targetNamespace) {
      unresolvedKeys.push(key);
      continue;
    }

    if (!manifest.has(targetNamespace)) {
      manifest.set(targetNamespace, new Set());
    }
    manifest.get(targetNamespace).add(key);
  }

  if (unresolvedKeys.length > 0) {
    console.error('[i18n-manifest] Unable to determine namespaces for the following keys:');
    for (const key of unresolvedKeys) {
      console.error(`  - ${key}`);
    }
    process.exit(1);
  }

  await mkdir(MANIFEST_DIR, { recursive: true });

  const existingFiles = new Set(
    (await readdir(MANIFEST_DIR).catch(() => []))
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.slice(0, -'.json'.length))
  );

  for (const [namespace, keys] of manifest) {
    const sortedKeys = Array.from(keys).sort();
    const targetPath = path.join(MANIFEST_DIR, `${namespace}.json`);
    await writeFile(targetPath, `${JSON.stringify(sortedKeys, null, 2)}\n`, 'utf8');
    existingFiles.delete(namespace);
  }

  for (const staleNamespace of existingFiles) {
    const stalePath = path.join(MANIFEST_DIR, `${staleNamespace}.json`);
    await unlink(stalePath).catch(() => {});
  }

  console.log(`[i18n-manifest] Updated manifest for ${manifest.size} namespace(s).`);
}

main().catch((error) => {
  console.error('[i18n-manifest] Unexpected error', error);
  process.exit(1);
});
