import { writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { renderWaitlistConfirm, renderWaitlistResend } from '@/lib/email/renderWaitlist';

function resolveConfirmUrl(): string {
  const explicit = process.env.CONFIRM_URL?.trim();
  if (explicit) return explicit;

  const base = process.env.APP_BASE_URL?.trim() || 'http://127.0.0.1:3000';
  const url = new URL('/api/waitlist/confirm', base);
  url.searchParams.set('token', 'preview-token');
  return url.toString();
}

async function writePreviewFile(filename: string, contents: string) {
  const filePath = path.join(os.tmpdir(), filename);
  await writeFile(filePath, contents, 'utf8');
  console.log(`[email:preview] wrote ${filePath}`);
  return filePath;
}

async function main() {
  const confirmUrl = resolveConfirmUrl();

  const confirm = await renderWaitlistConfirm({ confirmUrl });
  const resend = await renderWaitlistResend({ confirmUrl });

  await writePreviewFile('louhen_waitlist_confirm.html', confirm.html);
  await writePreviewFile('louhen_waitlist_resend.html', resend.html);

  console.log('[email:preview] plain-text samples');
  console.log(confirm.text);
  console.log('---');
  console.log(resend.text);
}

main().catch((error) => {
  console.error('[email:preview] failed', error);
  process.exitCode = 1;
});
