import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

if (process.env.SKIP_LHCI === '1') {
  console.log('Skipping Lighthouse run because SKIP_LHCI=1');
  process.exit(0);
}

const isSandbox = process.env.SANDBOX_VALIDATION === '1';
const previewBase = process.env.PREVIEW_BASE_URL;
const defaultBase = process.env.BASE_URL || 'http://localhost:4311';
const defaultLocale = process.env.DEFAULT_LOCALE || 'en';

if (isSandbox && (!previewBase || previewBase.trim().length === 0)) {
  console.error('SANDBOX_VALIDATION=1 requires PREVIEW_BASE_URL to be set.');
  process.exit(1);
}

const targetBase = (isSandbox ? previewBase : defaultBase).replace(/\/$/, '');
const defaultTarget = `${targetBase}/${defaultLocale}/method/`;
const overrideUrl = process.env.LHCI_URL;

const outputDir = process.env.LIGHTHOUSE_OUTPUT_DIR || 'lighthouse-report';
const resolvedOutputDir = path.resolve(outputDir);
process.env.LIGHTHOUSE_OUTPUT_DIR = resolvedOutputDir;
fs.rmSync(resolvedOutputDir, { recursive: true, force: true });
fs.mkdirSync(resolvedOutputDir, { recursive: true });

const args = ['npx', 'lhci', 'autorun', '--config=.lighthouserc.cjs', `--upload.outputDir=${resolvedOutputDir}`];

if (overrideUrl && overrideUrl.length > 0) {
  console.log(`Running Lighthouse for ${overrideUrl} (override)`);
} else {
  console.log(`Running Lighthouse using config default ${defaultTarget}`);
}

execSync(args.join(' '), { stdio: 'inherit' });
