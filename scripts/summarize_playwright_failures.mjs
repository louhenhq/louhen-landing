import fs from 'fs';
import path from 'path';

const REPORT_JSON = process.env.PW_REPORT_JSON_PATH || './playwright-report/report.json';
const OUT = process.env.PW_FAILURES_MD || './playwright-failures.md';

function safe(s){ return s==null ? '' : String(s); }

function pickAttachments(result){
  const atts = [];
  (result?.attachments || []).forEach(a=>{
    if(!a?.name || !a?.path) return;
    if (/screenshot|video|trace|error-context/i.test(a.name)) atts.push(`- ${a.name}: ${a.path}`);
  });
  return atts.join('\n');
}

const jsonPath = path.resolve(REPORT_JSON);
if (!fs.existsSync(jsonPath)) {
  console.error(`[summarize] JSON report not found at: ${jsonPath}`);
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(jsonPath,'utf8'));

const failed = [];
for (const s of data.suites || []) {
  for (const sp of s.specs || []) {
    for (const t of sp.tests || []) {
      for (const r of t.results || []) {
        if (r.status === 'failed') {
          const loc = (sp.file || '').replace(process.cwd()+path.sep,'');
          const err = r.error || {};
          failed.push({
            title: sp.title,
            file: loc,
            message: safe(err.message) || safe(err.value),
            stack: safe(err.stack),
            attachments: pickAttachments(r)
          });
        }
      }
    }
  }
}

let md = `# Playwright Failures\n\n`;

if (failed.length === 0) {
  md += `No failures found.\n`;
} else {
  md += `Found **${failed.length}** failing test(s):\n\n`;
  failed.forEach((f, i)=>{
    md += `## ${i+1}. ${f.title}\n`;
    if (f.file) md += `**File:** \`${f.file}\`\n\n`;
    if (f.message) md += `**Error:** ${f.message}\n\n`;
    if (f.attachments) md += `**Artifacts:**\n${f.attachments}\n\n`;
  });
  md += `\n---\n\n## Guidance for Codex\n- Prefer fixing tests first (selectors, timing, copy drift, consent/auth helpers).\n- Only touch runtime if contract changed and CONTEXT says so.\n- Keep diffs surgical; no new deps; respect build-vs-e2e env split.\n`;
}

fs.writeFileSync(OUT, md);
console.log(`[summarize] Wrote ${failed.length} failure(s) to ${OUT}`);
