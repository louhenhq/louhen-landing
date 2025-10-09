#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import net from 'node:net';
import process from 'node:process';

const DEFAULT_BASE_URL = 'http://127.0.0.1:4311';
const baseUrl = process.env.BASE_URL ?? DEFAULT_BASE_URL;

function parseHostAndPort(urlString) {
  try {
    const url = new URL(urlString);
    const port = Number.parseInt(url.port || '80', 10);
    return { host: url.hostname || '127.0.0.1', port: Number.isFinite(port) ? port : 4311 };
  } catch {
    return { host: '127.0.0.1', port: 4311 };
  }
}

const { host: serverHost, port: serverPort } = parseHostAndPort(baseUrl);

const playwrightRoot = process.env.PLAYWRIGHT_ARTIFACTS_DIR ?? 'artifacts/playwright';

const sharedEnv = {
  ...process.env,
  BASE_URL: baseUrl,
  APP_BASE_URL: baseUrl,
  IS_PRELAUNCH: process.env.IS_PRELAUNCH ?? 'true',
  TEST_E2E_SHORTCIRCUIT: process.env.TEST_E2E_SHORTCIRCUIT ?? 'true',
  TEST_E2E_BYPASS_TOKEN: process.env.TEST_E2E_BYPASS_TOKEN ?? 'e2e-mocked-token',
  HCAPTCHA_SECRET: process.env.HCAPTCHA_SECRET ?? 'test_secret',
};

const serverEnv = {
  ...sharedEnv,
  NODE_ENV: 'production',
  HOST: process.env.HOST ?? '0.0.0.0',
  PORT: String(serverPort),
};

async function runStep(label, command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      ...options,
    });

    child.on('error', (error) => {
      reject(new Error(`[${label}] failed to start: ${error.message}`));
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

async function waitForPort(host, port, timeoutMs = 120_000) {
  const startedAt = Date.now();

  async function attempt() {
    return new Promise((resolve) => {
      const socket = net.createConnection({ host, port }, () => {
        socket.end();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
    });
  }

  while (Date.now() - startedAt < timeoutMs) {
    const ok = await attempt();
    if (ok) return;
    await delay(500);
  }
  throw new Error(`Timed out waiting for http://${host}:${port}`);
}

let serverProcess;

async function startServer() {
  serverProcess = spawn('npm', ['run', 'start:test'], {
    stdio: 'inherit',
    env: serverEnv,
    shell: false,
  });

  serverProcess.on('exit', (code, signal) => {
    if (code && code !== 0) {
      console.warn(`[validate:local] test server exited early with code ${code}`);
    } else if (signal) {
      console.warn(`[validate:local] test server terminated with signal ${signal}`);
    }
  });

  serverProcess.on('error', (error) => {
    console.error('[validate:local] failed to launch test server', error);
  });

  await waitForPort(serverHost, serverPort);
}

async function stopServer() {
  if (!serverProcess) return;
  serverProcess.kill('SIGTERM');
  try {
    await once(serverProcess, 'exit');
  } catch {
    // ignore
  }
  serverProcess = undefined;
}

async function main() {
  process.stdout.write('[validate:local] linting…\n');
  await runStep('lint', 'npm', ['run', 'lint']);

  process.stdout.write('[validate:local] typechecking…\n');
  await runStep('typecheck', 'npm', ['run', 'typecheck']);

  process.stdout.write('[validate:local] building production bundle…\n');
  await runStep('build', 'npm', ['run', 'build']);

  process.stdout.write(`[validate:local] starting production server on ${baseUrl}…\n`);
  await startServer();
  process.stdout.write(`[validate:local] server ready at ${baseUrl}\n`);

  try {
    process.stdout.write('[validate:local] running unit tests…\n');
    await runStep('unit', 'npm', ['run', 'test:unit'], { env: sharedEnv });

    process.stdout.write('[validate:local] running Playwright E2E suite…\n');
    await runStep('playwright', 'npm', ['run', 'test:e2e'], {
      env: { ...sharedEnv, PLAYWRIGHT_ARTIFACTS_DIR: `${playwrightRoot}/e2e` },
    });

    process.stdout.write('[validate:local] running Playwright axe suite…\n');
    await runStep('axe', 'npm', ['run', 'test:axe'], {
      env: { ...sharedEnv, PLAYWRIGHT_ARTIFACTS_DIR: `${playwrightRoot}/axe` },
    });

    process.stdout.write('[validate:local] running Lighthouse (LHCI)…\n');
    await runStep('lhci', 'npm', ['run', 'lhci'], { env: sharedEnv });
  } finally {
    process.stdout.write('[validate:local] stopping test server…\n');
    await stopServer();
  }
}

process.on('SIGINT', async () => {
  await stopServer();
  process.exit(130);
});

process.on('SIGTERM', async () => {
  await stopServer();
  process.exit(143);
});

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await stopServer();
  process.exit(1);
});
