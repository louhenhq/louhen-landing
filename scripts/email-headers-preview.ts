import { writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

declare global {
  // eslint-disable-next-line no-var
  var __NONCE__: string;
}

import { renderWaitlistConfirm, renderWaitlistResend } from '@/lib/email/renderWaitlist';
import { buildStandardHeaders } from '@/lib/email/headers';

const baseUrl = (process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://louhen.eu').replace(/\/$/, '');
const unsubscribeEmail = 'unsubscribe@louhen.eu';
const replyTo = process.env.RESEND_REPLY_TO?.trim() || 'support@louhen.eu';

async function writePreview(filename: string, headers: Record<string, string>, body: string) {
  const filePath = path.join(os.tmpdir(), filename);
  const serializedHeaders = Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  const content = `${serializedHeaders}\n\n${body}`;
  await writeFile(filePath, content, 'utf8');
  console.log(`[email:headers] wrote ${filePath}`);
}

async function main() {
  const confirmUrl = `${baseUrl}/waitlist/confirm?token=preview-token`;

  const confirmEmail = await renderWaitlistConfirm({ confirmUrl });
  const previewEmail = 'preview@example.com';
  const confirmHeaders = buildStandardHeaders({
    email: previewEmail,
    unsubscribeMailto: unsubscribeEmail,
    replyTo,
  });
  confirmHeaders.Subject = 'Confirm your Louhen waitlist signup';
  confirmHeaders.To = previewEmail;
  confirmHeaders.From = process.env.RESEND_FROM || 'Louhen <hello@louhen.eu>';

  await writePreview('louhen_waitlist_confirm.eml', confirmHeaders, confirmEmail.text);

  const resendEmail = await renderWaitlistResend({ confirmUrl });
  const resendHeaders = buildStandardHeaders({
    email: previewEmail,
    unsubscribeMailto: unsubscribeEmail,
    replyTo,
  });
  resendHeaders.Subject = 'Your Louhen confirmation link';
  resendHeaders.To = previewEmail;
  resendHeaders.From = process.env.RESEND_FROM || 'Louhen <hello@louhen.eu>';

  await writePreview('louhen_waitlist_resend.eml', resendHeaders, resendEmail.text);

  console.log('[email:headers] preview complete');
}

main().catch((error) => {
  console.error('[email:headers] failed', error);
  process.exitCode = 1;
});
