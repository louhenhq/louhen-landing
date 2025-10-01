import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

if (process.env.SKIP_LHCI === '1') {
  console.log('Skipping Lighthouse run because SKIP_LHCI=1');
  process.exit(0);
}

const isSandbox = process.env.SANDBOX_VALIDATION === '1';
const previewBase = process.env.PREVIEW_BASE_URL;
const defaultBase = process.env.BASE_URL || 'http://localhost:4311';
const defaultLocale = (process.env.DEFAULT_LOCALE || 'en').trim() || 'en';

if (isSandbox && (!previewBase || previewBase.trim().length === 0)) {
  console.error('SANDBOX_VALIDATION=1 requires PREVIEW_BASE_URL to be set.');
  process.exit(1);
}

function sanitizeBase(raw) {
  return (raw || '').trim().replace(/\/$/, '');
}

function buildDefaultTarget() {
  const base = sanitizeBase(isSandbox ? previewBase : defaultBase);
  try {
    const url = new URL(base); // ensures valid base
    url.pathname = `/${defaultLocale.replace(/^\/+|\/+$/g, '')}/method/`;
    return url.toString();
  } catch (error) {
    console.error('Invalid BASE_URL/PREVIEW_BASE_URL provided for Lighthouse:', error.message);
    process.exit(1);
  }
}

function sanitizeOverride(raw, fallback) {
  if (!raw || raw.trim().length === 0) return fallback;
  try {
    const url = new URL(raw.trim());
    // Collapse duplicate slashes in pathname while preserving leading slash
    url.pathname = url.pathname.replace(/\/+/g, '/');
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url.toString();
  } catch (error) {
    console.warn(`Invalid LHCI_URL '${raw}'. Falling back to default target.`);
    return fallback;
  }
}

const defaultTarget = buildDefaultTarget();
const targetUrl = sanitizeOverride(process.env.LHCI_URL, defaultTarget);
process.env.LHCI_URL = targetUrl;

async function ensureReachable(url, attempts = 10) {
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const response = await fetch(url, { method: 'GET', redirect: 'manual' });
      if (response.status >= 200 && response.status < 400) {
        return true;
      }
      console.warn(`Attempt ${i}/${attempts}: Received status ${response.status} from ${url}`);
    } catch (error) {
      console.warn(`Attempt ${i}/${attempts}: Failed to reach ${url} (${error.message})`);
    }
    await sleep(3000);
  }
  return false;
}

if (!(await ensureReachable(targetUrl))) {
  console.error(`Unable to reach ${targetUrl}. Is the preview/local server running?`);
  process.exit(1);
}

const outputDir = process.env.LIGHTHOUSE_OUTPUT_DIR || 'lighthouse-report';
const resolvedOutputDir = path.resolve(outputDir);
process.env.LIGHTHOUSE_OUTPUT_DIR = resolvedOutputDir;
fs.rmSync(resolvedOutputDir, { recursive: true, force: true });
fs.mkdirSync(resolvedOutputDir, { recursive: true });

const args = ['npx', 'lhci', 'autorun', '--config=lighthouserc.cjs', `--upload.outputDir=${resolvedOutputDir}`];

console.log(`Running Lighthouse for ${targetUrl}`);

execSync(args.join(' '), { stdio: 'inherit' });
