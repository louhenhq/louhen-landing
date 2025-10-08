import * as React from 'react';
import { render } from '@react-email/render';

import WaitlistConfirmEmail from '@/emails/WaitlistConfirmEmail';
import WaitlistResendEmail from '@/emails/WaitlistResendEmail';

const supportEmail = process.env.RESEND_REPLY_TO?.trim();
const supportEmailProps: { supportEmail: string } | undefined = supportEmail
  ? { supportEmail }
  : undefined;

type RenderOptions = {
  confirmUrl: string;
};

type RenderResult = {
  html: string;
  text: string;
};

async function renderEmail(element: React.ReactElement): Promise<RenderResult> {
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { html, text };
}

export async function renderWaitlistConfirm({ confirmUrl }: RenderOptions): Promise<RenderResult> {
  return renderEmail(
    <WaitlistConfirmEmail confirmUrl={confirmUrl} {...(supportEmailProps ?? {})} />,
  );
}

export async function renderWaitlistResend({ confirmUrl }: RenderOptions): Promise<RenderResult> {
  return renderEmail(
    <WaitlistResendEmail confirmUrl={confirmUrl} {...(supportEmailProps ?? {})} />,
  );
}
