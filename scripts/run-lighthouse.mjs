import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

<<<<<<< HEAD
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
=======
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4311';
const READINESS_PATH = process.env.LHCI_READINESS_PATH ?? '/';
const MAX_DURATION_MS = (() => {
  const parsed = Number.parseInt(process.env.LHCI_TIMEOUT_MS ?? '', 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 10 * 60 * 1000;
})();
const thresholds = {
  performance: 0.9,
  accessibility: 0.9,
  'best-practices': 0.9,
  seo: 0.9,
};

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
let serverProcess = null;
let terminationHandlers = [];
let exiting = false;

function resolveReadinessUrl() {
  try {
    return new URL(READINESS_PATH, BASE_URL).toString();
  } catch {
    return BASE_URL;
  }
}

async function isServerReady() {
  try {
    const response = await fetch(resolveReadinessUrl(), { method: 'GET', redirect: 'manual' });
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED') {
      return false;
    }
    return false;
  }
}

async function waitForServerReady() {
  const retries = 40;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    if (await isServerReady()) return;
    await delay(500);
  }
  throw new Error(`Timed out waiting for server at ${BASE_URL}`);
}

async function ensureServer() {
  if (await isServerReady()) {
    return false;
  }

  let port = '4311';
  try {
    const url = new URL(BASE_URL);
    port = url.port || (url.protocol === 'https:' ? '443' : '3000');
  } catch {
    // fall back to default port
  }

  serverProcess = spawn(npmCmd, ['run', 'start', '--', '--port', port], {
    env: { ...process.env, PORT: port, BASE_URL },
    stdio: 'inherit',
  });

  serverProcess.on('error', (error) => {
    console.error('[lhci] Failed to start Next.js server', error);
  });

  const readyPromise = waitForServerReady();
  let earlyExitHandler;
  const earlyExitPromise = new Promise((_, reject) => {
    earlyExitHandler = (code, signal) => {
      reject(new Error(`[lhci] Next.js server exited early (code: ${code ?? 'null'}, signal: ${signal ?? 'null'})`));
    };
    serverProcess.once('exit', earlyExitHandler);
  });

  try {
    await Promise.race([readyPromise, earlyExitPromise]);
  } finally {
    if (earlyExitHandler) {
      serverProcess.removeListener('exit', earlyExitHandler);
    }
  }
  return true;
}

async function readLatestSummary() {
  const directory = '.lighthouseci';
  const manifestPath = path.join(directory, 'manifest.json');
  try {
    const rawManifest = await readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(rawManifest);
    if (Array.isArray(manifest) && manifest.length > 0 && manifest[manifest.length - 1]?.summary) {
      return manifest[manifest.length - 1].summary;
    }
  } catch (error) {
    const errno = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
    if (errno !== 'ENOENT') {
      throw error;
    }
  }

  const files = await readdir(directory);
  const jsonFiles = files.filter((file) => file.endsWith('.json'));
  if (jsonFiles.length === 0) {
    throw new Error('No Lighthouse JSON reports found.');
  }
  const latestReport = jsonFiles.sort().at(-1);
  if (!latestReport) {
    throw new Error('Unable to resolve latest Lighthouse report.');
  }
  const report = JSON.parse(await readFile(path.join(directory, latestReport), 'utf8'));
  if (!report || typeof report !== 'object' || !('categories' in report)) {
    throw new Error('Lighthouse report missing categories.');
  }
  const categories = report.categories;
  return Object.fromEntries(
    Object.entries(categories).map(([key, value]) => {
      const score = value && typeof value === 'object' && 'score' in value && typeof value.score === 'number' ? value.score : 0;
      return [key, score];
    })
  );
}

async function stopServer() {
  if (!serverProcess) {
    return;
  }

  const child = serverProcess;
  serverProcess = null;

  if (!child.killed) {
    child.kill('SIGTERM');
  }

  const forceTimer = setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }, 5_000);

  await new Promise((resolve) => {
    child.once('exit', () => {
      clearTimeout(forceTimer);
      resolve();
    });
  });
}

function registerTerminationHandlers() {
  const entries = [
    ['SIGINT', () => gracefulExit(130)],
    ['SIGTERM', () => gracefulExit(143)],
    [
      'uncaughtException',
      (error) => {
        console.error('[lhci] Uncaught exception', error);
        gracefulExit(1);
      },
    ],
    [
      'unhandledRejection',
      (reason) => {
        console.error('[lhci] Unhandled rejection', reason);
        gracefulExit(1);
      },
    ],
  ];

  terminationHandlers = entries;
  entries.forEach(([event, handler]) => {
    process.once(event, handler);
  });
}

function removeTerminationHandlers() {
  terminationHandlers.forEach(([event, handler]) => {
    process.removeListener(event, handler);
  });
  terminationHandlers = [];
}

async function gracefulExit(code) {
  if (exiting) {
    return;
  }
  exiting = true;
  await stopServer();
  removeTerminationHandlers();
  process.exitCode = code;
  process.exit(code);
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  if (minutes <= 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

async function runLighthouseWithTimeout() {
  return new Promise((resolve, reject) => {
    const child = spawn(npxCmd, ['lhci', 'autorun', '--config=lighthouserc.cjs'], {
      env: { ...process.env, BASE_URL },
      stdio: 'inherit',
    });

    let timedOut = false;
    let forceTimer;

    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      console.error(`[lhci] Timeout after ${formatDuration(MAX_DURATION_MS)} — terminating Lighthouse run`);
      child.kill('SIGTERM');
      forceTimer = setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5_000);
    }, MAX_DURATION_MS);

    child.on('error', (error) => {
      clearTimeout(timeoutTimer);
      if (forceTimer) clearTimeout(forceTimer);
      reject(error);
    });

    child.on('exit', (code, signal) => {
      clearTimeout(timeoutTimer);
      if (forceTimer) clearTimeout(forceTimer);
      if (timedOut) {
        reject(new Error(`Lighthouse run exceeded ${formatDuration(MAX_DURATION_MS)}`));
        return;
      }
      if (signal && code === null) {
        resolve(1);
        return;
      }
      resolve(code ?? 0);
    });
  });
}

(async () => {
  registerTerminationHandlers();
  let exitCode = 0;
  try {
    const startedServer = await ensureServer();
    if (startedServer) {
      console.log('[lhci] Started local Next.js server');
    } else {
      console.log('[lhci] Reusing existing server at', BASE_URL);
    }
    await rm('.lighthouseci', { recursive: true, force: true });

    const runExitCode = await runLighthouseWithTimeout();
    exitCode = runExitCode;

    const summary = await readLatestSummary().catch(() => null);
    if (summary && typeof summary === 'object') {
      const report = Object.fromEntries(
        Object.keys(thresholds).map((key) => [key, Number.isFinite(summary[key]) ? summary[key].toFixed(2) : '0.00'])
      );
      console.log('Lighthouse scores', report);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[lhci] run failed:', message);
    if (exitCode === 0) {
      exitCode = 1;
    }
  } finally {
    removeTerminationHandlers();
    await stopServer();
    if (!exiting) {
      exiting = true;
      process.exit(exitCode);
    } else {
      process.exitCode = exitCode;
    }
  }
})();
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
