#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const METHOD_NAMESPACE = 'method';

async function readMessages(locale) {
  const filePath = path.join(ROOT, 'messages', `${locale}.json`);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function collectStructure(reference, comparison, currentPath, issues) {
  if (Array.isArray(reference)) {
    if (!Array.isArray(comparison)) {
      issues.push(`Expected array at ${currentPath}, but found ${typeof comparison}`);
      return;
    }
    if (reference.length !== comparison.length) {
      issues.push(`Array length mismatch at ${currentPath}: EN=${reference.length} DE=${comparison.length}`);
    }
    const minLength = Math.min(reference.length, comparison.length);
    for (let index = 0; index < minLength; index += 1) {
      collectStructure(reference[index], comparison[index], `${currentPath}[${index}]`, issues);
    }
    return;
  }

  if (isObject(reference)) {
    if (!isObject(comparison)) {
      issues.push(`Expected object at ${currentPath}, but found ${typeof comparison}`);
      return;
    }
    const referenceKeys = Object.keys(reference);
    const comparisonKeys = Object.keys(comparison);
    const missingKeys = referenceKeys.filter((key) => !comparisonKeys.includes(key));
    const extraKeys = comparisonKeys.filter((key) => !referenceKeys.includes(key));

    missingKeys.forEach((key) => {
      issues.push(`Missing key in DE: ${currentPath ? `${currentPath}.` : ''}${key}`);
    });
    extraKeys.forEach((key) => {
      issues.push(`Extra key in DE: ${currentPath ? `${currentPath}.` : ''}${key}`);
    });

    referenceKeys.forEach((key) => {
      if (comparisonKeys.includes(key)) {
        collectStructure(reference[key], comparison[key], currentPath ? `${currentPath}.${key}` : key, issues);
      }
    });
    return;
  }
}

(async () => {
  const en = await readMessages('en');
  const de = await readMessages('de');

  if (!(METHOD_NAMESPACE in en)) {
    console.error(`Missing namespace in EN: ${METHOD_NAMESPACE}`);
    process.exit(1);
  }
  if (!(METHOD_NAMESPACE in de)) {
    console.error(`Missing namespace in DE: ${METHOD_NAMESPACE}`);
    process.exit(1);
  }

  const issues = [];
  collectStructure(en[METHOD_NAMESPACE], de[METHOD_NAMESPACE], METHOD_NAMESPACE, issues);

  if (issues.length > 0) {
    console.error('Method i18n parity check failed:');
    for (const issue of issues) {
      console.error(`  - ${issue}`);
    }
    process.exit(1);
  }

  console.log('Method i18n parity check passed.');
})();
