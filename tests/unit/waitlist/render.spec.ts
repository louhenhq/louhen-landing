import { describe, expect, it } from 'vitest';

import { renderWaitlistConfirm, renderWaitlistResend } from '@lib/email/renderWaitlist';

describe('renderWaitlistConfirm', () => {
  it('renders html and text that include the confirm URL', async () => {
    const confirmUrl = 'https://louhen.app/api/waitlist/confirm?token=preview';
    const { html, text } = await renderWaitlistConfirm({ confirmUrl });

    expect(html).toContain(confirmUrl);
    expect(html).toMatch(/Confirm email/i);
    expect(text).toContain(confirmUrl);
  });
});

describe('renderWaitlistResend', () => {
  it('renders html and text for resend email', async () => {
    const confirmUrl = 'https://louhen.app/api/waitlist/confirm?token=preview';
    const { html, text } = await renderWaitlistResend({ confirmUrl });

    expect(html).toContain(confirmUrl);
    expect(html).toMatch(/Confirm email/i);
    expect(text).toContain(confirmUrl);
  });
});
