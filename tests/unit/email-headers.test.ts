import { describe, expect, it } from 'vitest';

import { buildStandardHeaders } from '@/lib/email/headers';

describe('buildStandardHeaders', () => {
  it('produces transactional headers with list unsubscribe and auto-submitted', () => {
    const headers = buildStandardHeaders({
      unsubscribeMailto: 'unsubscribe@louhen.eu',
      unsubscribeUrl: 'https://louhen.eu/unsubscribe',
      replyTo: 'support@louhen.eu',
    });

    expect(headers['List-Unsubscribe']).toContain('<mailto:unsubscribe@louhen.eu>');
    expect(headers['List-Unsubscribe']).toContain('<https://louhen.eu/unsubscribe>');
    expect(headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(headers['Auto-Submitted']).toBe('auto-generated');
    expect(headers['Reply-To']).toBe('support@louhen.eu');
    expect(headers.Precedence).toBeUndefined();
  });

  it('includes marketing headers when requested', () => {
    const headers = buildStandardHeaders({
      marketing: true,
      unsubscribeMailto: 'unsubscribe@louhen.eu',
    });

    expect(headers.Precedence).toBe('bulk');
    expect(headers['Auto-Submitted']).toBe('auto-generated');
  });
});
