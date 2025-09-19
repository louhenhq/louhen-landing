import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.resolve(rootDir, '../messages');

const forbiddenPatterns = [
  '\\$begin:math:display\\$DE\\$end:math:display\\$',
  '\\$begin:math:display\\$EN\\$end:math:display\\$',
  'TODO:',
  '__PLACEHOLDER__'
];

let hasError = false;
const files = await readdir(messagesDir);

for (const file of files) {
  if (!file.endsWith('.json')) continue;
  const contents = await readFile(path.join(messagesDir, file), 'utf8');
  for (const token of forbiddenPatterns) {
    if (contents.includes(token)) {
      console.error(`Placeholder token "${token}" found in ${file}`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
}
