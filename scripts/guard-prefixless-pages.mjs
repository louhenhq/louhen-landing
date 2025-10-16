#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const APP_DIR = path.join(process.cwd(), 'app');

// Existing prefixless routes (utility or legacy shells) that remain until they are migrated
// to locale-prefixed segments. Adding a new marketing page outside this allowlist should
// fail CI, and the allowlist must not be extended without an explicit architecture decision.
const ALLOWED_SEGMENTS = new Set([
  'admin',
  'preferences',
  'status',
  'thanks',
  'tokens',
  'unsubscribe',
  'unsubscribed',
]);

const LEGACY_PREFIXLESS_PATHS = ['/method', '/privacy', '/terms', '/imprint'];

function findPrefixlessPages() {
  const entries = readdirSync(APP_DIR, { withFileTypes: true });
  const violations = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const segment = entry.name;
    const pageTsx = path.join(APP_DIR, segment, 'page.tsx');
    const pageTs = path.join(APP_DIR, segment, 'page.ts');

    if (!existsSync(pageTsx) && !existsSync(pageTs)) {
      continue;
    }

    if (!ALLOWED_SEGMENTS.has(segment)) {
      violations.push(segment);
    }
  }

  return violations.sort();
}

function verifyMiddlewareGuard() {
  const middlewarePath = path.join(process.cwd(), 'middleware.ts');
  if (!existsSync(middlewarePath)) {
    return LEGACY_PREFIXLESS_PATHS.map((legacyPath) => ({
      path: legacyPath,
      type: 'guard-missing',
      target: 'middleware.ts',
    }));
  }

  const source = readFileSync(middlewarePath, 'utf8');
  const guardIndex = source.indexOf("if (pathname !== '/')");
  const targetLocaleIndex = source.indexOf('const targetLocale = resolvePreferredLocale');
  const redirectIndex = source.indexOf('NextResponse.redirect(redirectUrl, 308)');

  if (guardIndex === -1 || targetLocaleIndex === -1 || redirectIndex === -1) {
    return LEGACY_PREFIXLESS_PATHS.map((legacyPath) => ({
      path: legacyPath,
      type: 'guard-missing',
      target: 'middleware.ts',
    }));
  }

  if (guardIndex > targetLocaleIndex || guardIndex > redirectIndex) {
    return LEGACY_PREFIXLESS_PATHS.map((legacyPath) => ({
      path: legacyPath,
      type: 'guard-order',
      target: 'middleware.ts',
    }));
  }

  return [];
}

async function main() {
  const violations = findPrefixlessPages();

  if (violations.length > 0) {
    console.error('Prefixless marketing guard failed:');
    for (const segment of violations) {
      console.error(`  - app/${segment}/page.tsx`);
    }
    console.error('Only root (app/page.tsx) and allowlisted utility routes may live outside locale-prefixed groups.');
    process.exit(1);
  }

  const middlewareViolations = verifyMiddlewareGuard();
  if (middlewareViolations.length > 0) {
    console.error('Prefixless runtime guard failed:');
    for (const violation of middlewareViolations) {
      console.error(`  - ${violation.path} reported ${violation.type} in ${violation.target}`);
    }
    console.error('Legacy marketing shells must continue to return 404. Ensure middleware keeps the prefixless guard in place.');
    process.exit(1);
  }

  console.log('Prefixless marketing guard passed.');
}

main().catch((error) => {
  try {
    const keys = Object.keys(error ?? {});
    if (keys.length > 0) {
      const summary = keys.reduce((acc, key) => {
        acc[key] = error[key];
        return acc;
      }, {});
      console.error('Guard failed with fields:', summary);
    }
  } catch {
    // best-effort logging
  }
  console.error(error);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
