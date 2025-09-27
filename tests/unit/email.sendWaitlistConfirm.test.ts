import { afterEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.fn();

vi.mock('@/lib/email/transport', () => ({
  getEmailTransport: () => ({
    name: 'noop' as const,
    send: sendMock,
  }),
}));

vi.mock('@/lib/email/headers', () => ({
  buildStandardHeaders: vi.fn().mockReturnValue({ 'List-Unsubscribe': '<mailto:unsubscribe@example.com>', 'Reply-To': 'hello@louhen.app' }),
}));

import { sendWaitlistConfirmEmail } from '@/lib/email/sendWaitlistConfirm';

afterEach(() => {
  sendMock.mockReset();
});

describe('sendWaitlistConfirmEmail', () => {
  it('sends localized email with confirm URL', async () => {
    process.env.APP_BASE_URL = 'https://www.louhen.app';
    await sendWaitlistConfirmEmail({ email: 'user@example.com', locale: 'de', token: 'token-123' });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const args = sendMock.mock.calls[0][0];
    expect(args.subject).toContain('Louhen-Warteliste');
    expect(args.html).toContain('https://www.louhen.app/waitlist/confirm?token=token-123');
    expect(args.text).toContain('https://www.louhen.app/waitlist/confirm?token=token-123');
  });
});
