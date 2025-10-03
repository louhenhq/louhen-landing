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
const canonicalPath = '/en-de/method';

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
    url.pathname = canonicalPath;
    return url.toString();
  } catch (error) {
    console.error('Invalid BASE_URL/PREVIEW_BASE_URL provided for Lighthouse:', error.message);
    process.exit(1);
  }
}

function normalizeUrl(raw) {
  const url = new URL(raw);
  url.pathname = url.pathname.replace(/\/+/g, '/');
  url.pathname = url.pathname.replace(/\/$/, '');
  return url.toString();
}

function resolveTargetUrl() {
  const defaultTarget = buildDefaultTarget();
  if (!process.env.LHCI_URL || process.env.LHCI_URL.trim().length === 0) {
    return normalizeUrl(defaultTarget);
  }

  try {
    return normalizeUrl(process.env.LHCI_URL.trim());
  } catch (error) {
    console.warn(`Invalid LHCI_URL '${process.env.LHCI_URL}'. Falling back to default target.`);
    return normalizeUrl(defaultTarget);
  }
}

async function waitForOk(initialUrl, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  let currentUrl = initialUrl;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(currentUrl, { method: 'GET', redirect: 'manual' });

      if ([301, 302, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (location) {
          currentUrl = normalizeUrl(new URL(location, currentUrl).toString());
          continue;
        }
      }

      if (response.status === 200) {
        return currentUrl;
      }

      lastError = new Error(`Received status ${response.status}`);
      console.warn(`Waiting for ${currentUrl}: ${lastError.message}`);
    } catch (error) {
      lastError = error;
      console.warn(`Waiting for ${currentUrl}: ${error.message}`);
    }

    await sleep(1500);
  }

  throw lastError ?? new Error(`Timed out waiting for ${initialUrl}`);
}

const outputDir = process.env.LIGHTHOUSE_OUTPUT_DIR || 'lighthouse-report';
const resolvedOutputDir = path.resolve(outputDir);
process.env.LIGHTHOUSE_OUTPUT_DIR = resolvedOutputDir;
fs.rmSync(resolvedOutputDir, { recursive: true, force: true });
fs.mkdirSync(resolvedOutputDir, { recursive: true });

const args = ['npx', 'lhci', 'autorun', '--config=lighthouserc.cjs', `--upload.outputDir=${resolvedOutputDir}`];

const requestedTarget = resolveTargetUrl();

let finalTarget;
try {
  finalTarget = await waitForOk(requestedTarget);
} catch (error) {
  console.error(`Unable to reach ${requestedTarget}: ${error.message}`);
  process.exit(1);
}

process.env.LHCI_URL = finalTarget;

console.log(`Resolved Lighthouse target: ${finalTarget}`);
console.log('Running Lighthouse audit via LHCI...');

const childEnv = {
  ...process.env,
  LH_ALLOW_INDEX: 'true',
};

execSync(args.join(' '), { stdio: 'inherit', env: childEnv });
