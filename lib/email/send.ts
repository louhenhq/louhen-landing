import { getResend } from '@/lib/resendOptional';

export async function sendWaitlistConfirmEmail(opts: { to: string; confirmUrl: string }) {
  const from = process.env.RESEND_FROM || 'Louhen <hello@louhen.com>';
  const subject = 'Confirm your email for Louhen';
  const preview = 'Tap to confirm your email and join the waitlist.';
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ffffff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;padding:24px;">
      <tr><td style="font-size:0;line-height:0;height:8px;">&zwnj;</td></tr>
      <tr>
        <td>
          <h1 style="margin:20px 0 8px;font-size:20px;">Confirm your email</h1>
          <p style="margin:0 0 16px;line-height:1.6;">
            Thanks for joining Louhen. Please confirm your email to complete your signup:
          </p>
          <p style="margin:0 0 16px;">
            <a href="${opts.confirmUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#0f172a;color:#ffffff;text-decoration:none;">Confirm email</a>
          </p>
          <p style="margin:0 0 16px;line-height:1.6;">
            Or copy and paste this link:
            <br/>
            <a href="${opts.confirmUrl}" style="color:#0f172a;word-break:break-all;">${opts.confirmUrl}</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const resend = await getResend();
  if (!resend) {
    console.log('[dev] sendWaitlistConfirmEmail ->', { to: opts.to, confirmUrl: opts.confirmUrl });
    return { ok: true, dev: true } as const;
  }
  await resend.emails.send({ from, to: opts.to, subject, headers: { 'X-Preheader': preview }, html });
  return { ok: true } as const;
}
