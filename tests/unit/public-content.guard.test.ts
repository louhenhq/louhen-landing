import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const SEARCH_ROOTS = [
  '.next/server/app',
  '.next/server/pages',
  '.next/static',
];

const FORBIDDEN_PATTERNS = [
  /20%\s*(?:off|rabatt)/i,
  /free\s+pair/i,
  /zweite[nr]?\s+kostenlos/i,
];

function scanDirectory(directory: string): string[] {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const hits: string[] = [];

  for (const entry of entries) {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      hits.push(...scanDirectory(resolved));
      continue;
    }

    if (!/\.(?:html|rsc|body|txt)$/i.test(entry.name)) {
      continue;
    }

    const contents = fs.readFileSync(resolved, 'utf8');
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(contents)) {
        hits.push(`${resolved} -> ${pattern}`);
      }
    }
  }

  return hits;
}

describe('LouhenFit disclosure guard', () => {
  it('does not leak tier details in built output', () => {
    const roots = SEARCH_ROOTS.map((root) => path.resolve(root)).filter((root) => fs.existsSync(root));

    if (roots.length === 0) {
      console.warn('[content-guard] No build output found; skipping scan.');
      return;
    }

    const matches = roots.flatMap(scanDirectory);
    expect(matches, matches.length ? `Remove LouhenFit tier references from public output:\n${matches.join('\n')}` : undefined).toHaveLength(0);
  });
});
