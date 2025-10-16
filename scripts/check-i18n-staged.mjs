#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const files = process.argv.slice(2).filter(Boolean);

if (files.length === 0) {
  process.exit(0);
}

const namespaces = new Set();

for (const file of files) {
  const normalized = file.replace(/\\/g, '/');
  if (!normalized.startsWith('messages/en/') || !normalized.endsWith('.json')) {
    continue;
  }
  const baseName = path.basename(normalized, '.json');
  if (baseName) {
    namespaces.add(baseName);
  }
}

if (namespaces.size === 0) {
  process.exit(0);
}

const namespaceList = Array.from(namespaces).join(',');

const child = spawn(
  process.execPath,
  [path.resolve(rootDir, 'check-i18n-placeholders.mjs'), '--ns', namespaceList],
  {
    stdio: 'inherit',
  }
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
