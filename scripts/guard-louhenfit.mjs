#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = [join(ROOT, '.next'), join(ROOT, 'messages')];
const ALLOW_DIRS = [join(ROOT, 'CONTEXT')];

const DISALLOWED_PATTERNS = [
  /\b20%\b/i,
  /\bfirst\s+misfit\b/i,
  /\bsecond\s+misfit\b/i,
  /\bfree\s+pair\b/i,
  /\bfree\s+shoes?\b/i,
  /\bcompensation\s+(?:details|tiers?)\b/i,
  /\bdiscount\s+on\s+your\s+next\b/i,
];

const LOUHENFIT_NUMERIC_PATTERN = /louhenfit[^\n]{0,80}?\d+%/i;

const offenders = [];

function isAllowed(filePath) {
  return ALLOW_DIRS.some((allowed) => filePath.startsWith(allowed));
}

function scanFile(filePath) {
  if (isAllowed(filePath)) return;
  const ext = extname(filePath);
  if (!['.js', '.mjs', '.json', '.html', '.txt', ''].includes(ext)) return;

  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return;
  }

  for (const pattern of DISALLOWED_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      offenders.push({ filePath, snippet: match[0] });
      return;
    }
  }

  const louhenfitMatch = content.match(LOUHENFIT_NUMERIC_PATTERN);
  if (louhenfitMatch) {
    offenders.push({ filePath, snippet: louhenfitMatch[0] });
  }
}

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    let stats;
    try {
      stats = statSync(fullPath);
    } catch {
      continue;
    }

    if (stats.isDirectory()) {
      walk(fullPath);
    } else if (stats.isFile()) {
      scanFile(fullPath);
    }
  }
}

for (const target of TARGET_DIRS) {
  walk(target);
}

if (offenders.length) {
  console.error('❌ LouhenFit disclosure guard failed:');
  for (const { filePath, snippet } of offenders) {
    console.error(`- ${filePath}: "${snippet.trim()}"`);
  }
  process.exit(1);
}

console.log('✅ LouhenFit disclosure guard passed.');
