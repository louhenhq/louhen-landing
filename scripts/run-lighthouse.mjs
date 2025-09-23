#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { rm, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:4311').replace(/\/$/, '');
const baseBudgets = {
  performance: 0.8,
  accessibility: 0.9,
  'best-practices': 0.9,
  seo: 0.9,
};

const buildTarget = (path) => ({ path, budgets: { ...baseBudgets } });
const defaultTargets = ['/en/guides', '/en/method'].map(buildTarget);
const cliPaths = process.argv.slice(2);

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
let serverProcess = null;

async function isServerReady() {
  try {
    const response = await fetch(BASE_URL, { method: 'GET' });
    return response.ok || response.status >= 200;
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

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });
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
    env: { ...process.env, BASE_URL },
    stdio: 'inherit',
  });

  const terminate = () => {
    if (serverProcess) {
      serverProcess.kill('SIGINT');
      serverProcess = null;
    }
  };

  process.on('SIGINT', () => {
    terminate();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    terminate();
    process.exit(143);
  });
  process.on('exit', terminate);

  await waitForServerReady();
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

async function cleanupServer(started) {
  if (started && serverProcess) {
    const child = serverProcess;
    child.kill('SIGINT');
    await new Promise((resolve) => {
      child.once('exit', () => resolve());
    });
    serverProcess = null;
  }
}

(async () => {
  let startedServer = false;
  try {
    startedServer = await ensureServer();
    const targets = cliPaths.length ? cliPaths.map(buildTarget) : defaultTargets;
    const results = [];
    const failures = [];

    for (const target of targets) {
      await rm('.lighthouseci', { recursive: true, force: true });
      const targetUrl = target.path.startsWith('http') ? target.path : `${BASE_URL}${target.path}`;
      await runCommand(npxCmd, ['lhci', 'collect', '--config=lighthouserc.cjs', `--url=${targetUrl}`], {
        env: { ...process.env, BASE_URL },
      });
      const summary = await readLatestSummary();
      results.push({ path: target.path, summary });

      const budgets = target.budgets ?? baseBudgets;
      const failing = Object.entries(budgets).filter(([key, min]) => {
        const score = typeof summary[key] === 'number' ? summary[key] : 0;
        return score < min;
      });

      if (failing.length) {
        failures.push({ path: target.path, failing, summary });
      }
    }

    const pct = (score) => `${Math.round((Number.isFinite(score) ? score : 0) * 100)}`;
    results.forEach(({ path, summary }) => {
      const formatted = {
        performance: pct(summary.performance),
        accessibility: pct(summary.accessibility),
        'best-practices': pct(summary['best-practices']),
        seo: pct(summary.seo),
      };
      console.log(`[Lighthouse] ${path}`, formatted);
    });

    if (failures.length) {
      console.error('Lighthouse scores below budget:');
      failures.forEach(({ path, failing, summary }) => {
        failing.forEach(([key, min]) => {
          const score = typeof summary[key] === 'number' ? summary[key] : 0;
          console.error(`  ${path} – ${key}: ${(score * 100).toFixed(0)} < ${(min * 100).toFixed(0)}`);
        });
      });
      process.exitCode = 1;
      return;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await cleanupServer(startedServer);
  }
})();
