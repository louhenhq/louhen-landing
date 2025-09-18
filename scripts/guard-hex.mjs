#!/usr/bin/env node
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

const IGNORE_DIRS = new Set([
  'node_modules',
  '.next',
  'public/tokens',
  'packages',
  'dist',
  'build',
]);

const ALLOWED_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.scss',
  '.md',
  '.mdx',
  '.html',
  '.json',
  '.svg',
]);

const IGNORE_PATH_PARTS = [
  '/tokens/tokens.json',
  '/tokens/tokens.css',
  '/tokens/tokens.dark.css',
  '/tokens/tokens.hc.css',
  '/build/web/tokens',
];

function isTextPath(p) {
  for (const ext of ALLOWED_EXTS) {
    if (p.endsWith(ext)) return true;
  }
  return false;
}

function isIgnoredPath(p) {
  if (IGNORE_PATH_PARTS.some((part) => p.includes(part))) return true;
  const segments = p.split(/[\\/]+/);
  return segments.some((seg) => IGNORE_DIRS.has(seg));
}

function scanFile(path) {
  try {
    const buf = readFileSync(path, 'utf8');
    const lines = buf.split(/\r?\n/);
    const hits = [];
    for (let i = 0; i < lines.length; i += 1) {
      const match = lines[i].match(HEX_RE);
      if (match) {
        hits.push({ line: i + 1, matches: match });
      }
    }
    return hits;
  } catch {
    return [];
  }
}

const dashIndex = process.argv.indexOf('--');
const argvFiles = dashIndex === -1 ? [] : process.argv.slice(dashIndex + 1).filter(Boolean);
let files = argvFiles;

function walk(dir, acc) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (isIgnoredPath(p)) continue;
    const info = statSync(p);
    if (info.isDirectory()) {
      walk(p, acc);
    } else {
      acc.push(p);
    }
  }
}

if (files.length === 0) {
  const roots = ['app', 'components', 'lib', 'pages', 'styles', 'scripts'];
  files = [];
  for (const root of roots) {
    const base = resolve(root);
    try {
      walk(base, files);
    } catch {}
  }
}

files = files
  .map((f) => resolve(f))
  .filter((f) => !isIgnoredPath(f))
  .filter((f) => isTextPath(f));

let violations = 0;

for (const file of files) {
  const hits = scanFile(file);
  if (hits.length) {
    const preview = hits
      .slice(0, 3)
      .map((hit) => `  line ${hit.line}: ${hit.matches.join(', ')}`)
      .join('\n');
    console.error(`\n❌ Hardcoded hex colour(s) in ${file}:\n${preview}${hits.length > 3 ? '\n  ...' : ''}`);
    violations += 1;
  }
}

if (violations > 0) {
  console.error('\nBlocked: Found hardcoded hex colours outside design tokens.');
  console.error('Use CSS variables from design tokens or add new tokens via @louhen/design-tokens.');
  process.exit(1);
}

console.log('✅ No hardcoded hex colours detected in staged files.');
