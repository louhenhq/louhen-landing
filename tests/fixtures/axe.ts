import { Buffer } from 'node:buffer';
import AxeBuilder from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type AxeContext = {
  route: string;
  locale: string;
  viewport: 'desktop' | 'mobile';
  disabledRules?: string[];
};

export type AllowlistEntry = {
  rule: string;
  selector: string;
  reason: string;
  owner: string;
  added: string;
};

// Keep this list short; document each entry in /CONTEXT/tests.md.
const ALLOWLIST: AllowlistEntry[] = [];

function isAllowed(rule: string, targets: string[]): boolean {
  return targets.some((target) =>
    ALLOWLIST.some((entry) => entry.rule === rule && target.includes(entry.selector)),
  );
}

export async function runAxe(page: Page, info: TestInfo, context: AxeContext): Promise<void> {
  const builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']);

  if (context.disabledRules && context.disabledRules.length > 0) {
    builder.disableRules(context.disabledRules);
  }

  const result = await builder.analyze();

  const filteredViolations = result.violations
    .map((violation) => ({
      ...violation,
      nodes: violation.nodes.filter((node) => {
        const targets = Array.isArray(node.target) ? (node.target as string[]) : [];
        return !isAllowed(violation.id, targets);
      }),
    }))
    .filter((violation) => violation.nodes.length > 0);

  const summary = {
    context,
    violations: filteredViolations,
    incomplete: result.incomplete,
    timestamp: new Date().toISOString(),
  };

  const artifactRoot = process.env.PLAYWRIGHT_ARTIFACTS_DIR ?? 'artifacts/playwright/axe';
  const outDir = path.join(artifactRoot, 'a11y');
  await mkdir(outDir, { recursive: true });
  const slug = `${context.route}-${context.locale}-${context.viewport}`
    .replace(/[^a-z0-9-]/gi, '-')
    .toLowerCase();
  const reportPath = path.join(outDir, `${slug}.json`);
  const reportContent = JSON.stringify(summary, null, 2);
  await writeFile(reportPath, reportContent, 'utf8');
  await info.attach(`axe-${slug}`, {
    body: Buffer.from(reportContent),
    contentType: 'application/json',
  });

  if (filteredViolations.length > 0) {
    const lines = filteredViolations.flatMap((violation) =>
      violation.nodes.map((node) => {
        const targets = node.target?.join(', ') ?? '(no selector)';
        return `- [${violation.id}] ${violation.help} → ${targets} (${violation.helpUrl})`;
      }),
    );
    throw new Error(`Axe found ${filteredViolations.length} violation(s) on ${context.route} (${context.locale}/${context.viewport}):\n${lines.join('\n')}`);
  }
}

export function listAllowlist(): AllowlistEntry[] {
  return [...ALLOWLIST];
}
