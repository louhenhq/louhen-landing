import { describe, expect, it, beforeEach, vi } from 'vitest';

const store = new Map<string, Record<string, unknown>>();

vi.mock('@/lib/firebaseAdmin', () => ({
  initAdmin: () => ({
    firestore: () => ({
      collection: () => ({
        doc: (id: string) => ({
          async get() {
            return {
              exists: store.has(id),
              data: () => store.get(id),
            };
          },
          async set(data: Record<string, unknown>, options: { merge?: boolean }) {
            const existing = store.get(id) ?? {};
            store.set(id, options?.merge ? { ...existing, ...data } : data);
          },
        }),
      }),
    }),
  }),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => new Date().toISOString(),
  },
}));

vi.stubEnv('SUPPRESSION_SALT', 'test-salt');

import { buildUnsubUrl, signUnsubToken, verifyUnsubToken } from '@/lib/email/tokens';
import { DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { hashEmail, isSuppressed, shouldSend, upsertSuppression } from '@/lib/email/suppress';

const TEST_EMAIL = 'User@example.com ';

beforeEach(() => {
  store.clear();
});

describe('hashEmail', () => {
  it('produces deterministic hash for normalized email', () => {
    const first = hashEmail(TEST_EMAIL);
    const second = hashEmail('user@example.com');
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('suppression lifecycle', () => {
  it('upserts suppression and blocks sends', async () => {
    const email = 'test@example.com';
    let state = await shouldSend({ email, scope: 'transactional' });
    expect(state.allowed).toBe(true);

    await upsertSuppression({ email, scope: 'all', source: 'test', reason: 'unit-test' });

    const suppression = await isSuppressed(email, 'transactional');
    expect(suppression.suppressed).toBe(true);
    expect(suppression.record?.scope).toBe('all');

    state = await shouldSend({ email, scope: 'transactional' });
    expect(state.allowed).toBe(false);
  });
});

describe('unsubscribe tokens', () => {
  it('round-trips token signing and verification', () => {
    const token = signUnsubToken({ email: TEST_EMAIL, scope: 'all' });
    const payload = verifyUnsubToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.email).toBe('user@example.com');
    expect(payload?.scope).toBe('all');
  });

  it('rejects tampered tokens', () => {
    const token = signUnsubToken({ email: TEST_EMAIL, scope: 'all' });
    const [payload] = token.split('.');
    const tampered = `${payload}.AAAA`;
    const result = verifyUnsubToken(tampered);
    expect(result).toBeNull();
  });

  it('builds unsubscribe URL with token', () => {
    vi.stubEnv('APP_BASE_URL', 'https://louhen.eu');
    const url = buildUnsubUrl('tester@example.com', 'all');
    const locale = DEFAULT_LOCALE.value;
    const pattern = new RegExp(`^https://louhen\\.eu/${locale}/unsubscribe\\?token=`);
    expect(url).toMatch(pattern);
  });
});
