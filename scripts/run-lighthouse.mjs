#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { rm, readFile, mkdir, writeFile, cp, appendFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('../lighthouserc.cjs');
const { defaultLocale, targetLocales } = config;

const HOST = process.env.HOST ?? '127.0.0.1';
const parsedPort = Number.parseInt(process.env.PORT ?? '4311', 10);
const PORT = Number.isFinite(parsedPort) ? parsedPort : 4311;
const hostname = HOST.split('://').pop() ?? HOST;
const BASE_URL = process.env.BASE_URL ?? `http://${hostname}:${PORT}`;
const READINESS_PATH = process.env.LHCI_READINESS_PATH ?? '/';
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
let serverProcess = null;
let exiting = false;

async function runStep(label, command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      ...options,
    });

    child.on('error', (error) => {
      reject(new Error(`[${label}] failed: ${error.message}`));
    });

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        const reason = signal ? `signal ${signal}` : `exit code ${code}`;
        reject(new Error(`[${label}] exited with ${reason}`));
      }
    });
  });
}

async function waitForServerReady(url) {
  const retries = 40;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(url, { method: 'GET', redirect: 'manual' });
      if (response.ok) return;
    } catch {
      // ignore ECONNREFUSED etc
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for server at ${url}`);
}

async function startServer() {
  if (serverProcess) return;

  serverProcess = spawn(npmCmd, ['run', 'start:test'], {
    stdio: 'inherit',
    env: { ...process.env, HOST: hostname, PORT: String(PORT), BASE_URL },
    shell: false,
  });

  serverProcess.on('error', (error) => {
    console.error('[lhci] failed to start Next.js server', error);
  });

  serverProcess.on('exit', (code, signal) => {
    if (!exiting && (code !== 0 || signal)) {
      console.error(`[lhci] Next.js server exited early (code: ${code}, signal: ${signal})`);
    }
  });

  const readinessUrl = new URL(READINESS_PATH, BASE_URL).toString();
  await waitForServerReady(readinessUrl);
}

async function ensureServer() {
  const readinessUrl = new URL(READINESS_PATH, BASE_URL).toString();
  try {
    const response = await fetch(readinessUrl, { method: 'GET', redirect: 'manual' });
    if (response.ok) {
      return false;
    }
  } catch {
    // ignore
  }
  await startServer();
  return true;
}

async function stopServer() {
  if (!serverProcess) return;
  serverProcess.kill('SIGTERM');
  await delay(500);
  serverProcess = null;
}

function deviceEnv(device) {
  if (device === 'desktop') {
    return {
      LHCI_COLLECT__SETTINGS__FORM_FACTOR: 'desktop',
      LHCI_COLLECT__SETTINGS__SCREEN_EMULATION__DISABLED: 'true',
      LHCI_COLLECT__SETTINGS__SCREEN_EMULATION__MOBILE: 'false',
    };
  }
  return {
    LHCI_COLLECT__SETTINGS__FORM_FACTOR: 'mobile',
    LHCI_COLLECT__SETTINGS__SCREEN_EMULATION__DISABLED: 'false',
    LHCI_COLLECT__SETTINGS__SCREEN_EMULATION__MOBILE: 'true',
  };
}

async function runLighthousePass(device) {
  const env = {
    ...process.env,
    BASE_URL,
    ...deviceEnv(device),
  };

  await runStep(`lhci collect (${device})`, npxCmd, ['lhci', 'collect', '--config=lighthouserc.cjs', '--output=json', '--output=html'], { env });
  await runStep(`lhci assert (${device})`, npxCmd, ['lhci', 'assert', '--config=lighthouserc.cjs'], { env });
}

function parseRouteAndLocale(urlString) {
  const url = new URL(urlString);
  const segments = url.pathname.replace(/\/$/, '').split('/').filter(Boolean);
  let locale = defaultLocale;
  if (segments.length > 0 && targetLocales.includes(segments[0])) {
    locale = segments.shift();
  }
  const routePath = '/' + segments.join('/');
  const normalizedRoute = routePath === '/' ? '/' : routePath;
  const routeSlug = normalizedRoute === '/' ? 'home' : normalizedRoute.replace(/^\//, '').replace(/\//g, '-');
  return { locale, route: normalizedRoute, routeSlug };
}

function formatLocale(locale) {
  return locale.replace(/-/g, '_');
}

async function buildArtifacts() {
  const reportDir = '.lighthouseci';
  const artifactDir = 'artifacts/lighthouse';

  await rm(artifactDir, { recursive: true, force: true });
  await mkdir(artifactDir, { recursive: true });

  const manifestPath = path.join(reportDir, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  await cp(manifestPath, path.join(artifactDir, 'manifest.json'), { force: true });

  const summaryRows = [];

  for (const entry of manifest) {
    const jsonPath = path.join(reportDir, entry.jsonPath);
    const htmlPath = entry.htmlPath ? path.join(reportDir, entry.htmlPath) : null;
    const lhr = JSON.parse(await readFile(jsonPath, 'utf8'));
    const device = lhr.configSettings.formFactor || lhr.configSettings.emulatedFormFactor || 'mobile';
    const { locale, route, routeSlug } = parseRouteAndLocale(entry.url);
    const slug = `${routeSlug}_${formatLocale(locale)}_${device}`;

    await cp(jsonPath, path.join(artifactDir, `${slug}.json`), { force: true });
    if (htmlPath) {
      await cp(htmlPath, path.join(artifactDir, `${slug}.html`), { force: true });
    }

    const categories = lhr.categories ?? {};
    const audits = lhr.audits ?? {};
    const perf = Math.round((categories.performance?.score ?? 0) * 100);
    const a11y = Math.round((categories.accessibility?.score ?? 0) * 100);
    const seo = Math.round((categories.seo?.score ?? 0) * 100);
    const lcp = Math.round((audits['largest-contentful-paint']?.numericValue ?? 0));
    const tbt = Math.round((audits['total-blocking-time']?.numericValue ?? 0));
    const cls = Number((audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3));

    summaryRows.push({ route, locale, device, slug, perf, a11y, seo, lcp, tbt, cls });
  }

  summaryRows.sort((a, b) => a.slug.localeCompare(b.slug));

  const summaryLines = [
    '### Lighthouse Summary',
    '',
    '| Page | Locale | Device | Perf | A11y | SEO | LCP (ms) | TBT (ms) | CLS |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...summaryRows.map((row) => `| ${row.route} | ${row.locale} | ${row.device} | ${row.perf} | ${row.a11y} | ${row.seo} | ${row.lcp} | ${row.tbt} | ${row.cls} |`),
    '',
  ];

  const summaryText = summaryLines.join('\n');
  await writeFile(path.join(artifactDir, 'summary.md'), summaryText, 'utf8');

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `\n${summaryText}\n`, 'utf8');
  }
}

async function main() {
  const startedServer = await ensureServer();
  try {
    await rm('.lighthouseci', { recursive: true, force: true });

    process.stdout.write('[lhci] Running mobile profiles...\n');
    await runLighthousePass('mobile');

    process.stdout.write('[lhci] Running desktop profiles...\n');
    await runLighthousePass('desktop');

    await buildArtifacts();
  } finally {
    exiting = true;
    if (startedServer) {
      await stopServer();
    }
  }
}

process.on('SIGINT', async () => {
  exiting = true;
  await stopServer();
  process.exit(130);
});

process.on('SIGTERM', async () => {
  exiting = true;
  await stopServer();
  process.exit(143);
});

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  exiting = true;
  await stopServer();
  process.exit(1);
});
