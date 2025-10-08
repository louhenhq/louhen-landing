#!/usr/bin/env node
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const ROOT = resolve('.');
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const INCLUDE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.md', '.mdx']);

const SKIP_PATH_SNIPPETS = [
  `${join('', 'node_modules')}`,
  `${join('', '.next')}`,
  `${join('', '.git')}`,
  `${join('', 'dist')}`,
  `${join('', 'build')}`,
  `${join('', 'coverage')}`,
  `${join('', '.cache')}`,
  `${join('', 'playwright-report')}`,
  `${join('', 'test-results')}`,
  `${join('', 'artifacts')}`,
  `${join('', 'ci-artifacts')}`,
  `${join('', 'public', 'tokens')}`,
  `${join('', 'packages', 'design-tokens')}`,
];

const ALLOWED_FILES = new Set([
  resolve(ROOT, 'lib/email/colors.ts'),
]);

const GENERATED_HEADER = '// GENERATED FILE - DO NOT EDIT. Generated from design tokens.';

const REPORT_HEADER = '# Color policy violations';

const optionArgsEnd = process.argv.indexOf('--');
const optionArgs = optionArgsEnd === -1 ? process.argv.slice(2) : process.argv.slice(2, optionArgsEnd);
const fileArgs = optionArgsEnd === -1 ? [] : process.argv.slice(optionArgsEnd + 1).filter(Boolean);

let scanAll = false;
let reportPath;
let reportAbs;
let mode = 'enforce';

const envMode = process.env.COLOR_POLICY_MODE?.toLowerCase().trim();
if (envMode === 'warn' || envMode === 'enforce') {
  mode = envMode;
}

for (let i = 0; i < optionArgs.length; i += 1) {
  const arg = optionArgs[i];
  if (arg === '--ci' || arg === '--mode=ci' || arg === '--all') {
    scanAll = true;
  } else if (arg === '--report') {
    reportPath = optionArgs[i + 1];
    i += 1;
  } else if (arg.startsWith('--report=')) {
    reportPath = arg.split('=')[1];
  } else if (arg === '--warn' || arg === '--mode=warn') {
    mode = 'warn';
  } else if (arg === '--enforce' || arg === '--mode=enforce') {
    mode = 'enforce';
  }
}

if (reportPath) {
  reportAbs = resolve(reportPath);
}

function shouldSkipPath(absPath) {
  if (ALLOWED_FILES.has(absPath)) {
    verifyGeneratedHeader(absPath);
    return true;
  }
  const normalized = absPath.split(/\\|\//).join('/');
  return SKIP_PATH_SNIPPETS.some((snippet) => normalized.includes(snippet));
}

function isIncludedExt(absPath) {
  const ext = extname(absPath);
  return INCLUDE_EXTS.has(ext);
}

function walk(dir, acc) {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    if (shouldSkipPath(abs)) continue;
    let stats;
    try {
      stats = statSync(abs);
    } catch {
      continue;
    }
    if (stats.isDirectory()) {
      walk(abs, acc);
    } else if (stats.isFile()) {
      if (!isIncludedExt(abs)) continue;
      acc.push(abs);
    }
  }
}

let files = [];
if (scanAll) {
  walk(ROOT, files);
} else if (fileArgs.length > 0) {
  files = fileArgs.map((f) => resolve(f)).filter((abs) => !shouldSkipPath(abs) && isIncludedExt(abs));
} else {
  const defaults = ['app', 'components', 'emails', 'lib', 'scripts', 'src'];
  for (const dir of defaults) {
    const abs = resolve(dir);
    try {
      walk(abs, files);
    } catch {
      /* ignore missing directories */
    }
  }
}

const hexViolations = new Map();
const emailViolations = [];
const generatedHeaderViolations = [];

function verifyGeneratedHeader(absPath) {
  try {
    const firstLine = readFileSync(absPath, 'utf8').split(/\r?\n/, 1)[0]?.trim();
    if (firstLine !== GENERATED_HEADER) {
      generatedHeaderViolations.push({ file: absPath, expected: GENERATED_HEADER, actual: firstLine || '' });
    }
  } catch (error) {
    generatedHeaderViolations.push({ file: absPath, expected: GENERATED_HEADER, actual: '<<unable to read file>>' });
  }
}

function recordHex(file, line, matches) {
  if (!hexViolations.has(file)) hexViolations.set(file, []);
  hexViolations.get(file).push({ line, matches });
}

function isEmailTemplate(absPath) {
  const rel = relative(ROOT, absPath).split(/\\|\//).join('/');
  return rel.startsWith('emails/') || rel.startsWith('lib/email/templates/');
}

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    const matches = line.match(HEX_RE);
    if (matches) {
      recordHex(file, index + 1, matches);
    }
  });

  if (isEmailTemplate(file) && !content.includes('emailColors')) {
    emailViolations.push({ file, message: 'Email templates must import emailColors/emailColorsDark (generated palette).' });
  }
}

const problems = hexViolations.size + emailViolations.length + generatedHeaderViolations.length;

function formatRelative(absPath) {
  return relative(ROOT, absPath).split(/\\/g).join('/');
}

function printViolations() {
  for (const [file, hits] of hexViolations.entries()) {
    const rel = formatRelative(file);
    console.error(`\n❌ Hardcoded hex colour(s) in ${rel}`);
    hits.slice(0, 5).forEach((hit) => {
      console.error(`  line ${hit.line}: ${hit.matches.join(', ')}`);
    });
    if (hits.length > 5) console.error('  ...');
  }

  for (const violation of emailViolations) {
    console.error(`\n❌ Email colour policy violation in ${formatRelative(violation.file)}`);
    console.error(`  ${violation.message}`);
  }

  for (const violation of generatedHeaderViolations) {
    console.error(`\n❌ Generated palette header missing in ${formatRelative(violation.file)}`);
    console.error(`  Expected first line: "${violation.expected}"`);
    console.error(`  Found: "${violation.actual}"`);
  }

  if (problems > 0) {
    console.error('\n✋ Replace hex values with design tokens or the generated email palette (emailColors.*).');
    if (reportAbs) {
      console.error(`ℹ️  Full report: ${formatRelative(reportAbs)}`);
    }
  } else {
    console.log('✅ No disallowed hex colours detected.');
  }
}

function writeReport() {
  if (!reportAbs) return;
  const lines = [REPORT_HEADER];
  if (problems === 0) {
    lines.push('', '- none ✅');
  } else {
    for (const [file, hits] of hexViolations.entries()) {
      const rel = formatRelative(file);
      hits.forEach((hit) => {
        lines.push(`- HEX ${rel}:${hit.line} -> ${hit.matches.join(', ')}`);
      });
    }
    for (const violation of emailViolations) {
      lines.push(`- EMAIL ${formatRelative(violation.file)} -> ${violation.message}`);
    }
    for (const violation of generatedHeaderViolations) {
      lines.push(`- HEADER ${formatRelative(violation.file)} -> expected "${violation.expected}" but found "${violation.actual}"`);
    }
  }
  mkdirSync(dirname(reportAbs), { recursive: true });
  writeFileSync(reportAbs, `${lines.join('\n')}\n`, 'utf8');
}

writeReport();
printViolations();

if (problems > 0 && mode !== 'warn') {
  process.exit(1);
}

if (problems > 0 && mode === 'warn') {
  console.warn('⚠️  Color policy violations detected (warn mode) — CI will stay green, but issues must be resolved.');
}
