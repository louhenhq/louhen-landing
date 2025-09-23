import { beforeEach, afterEach, describe, expect, it } from 'vitest';

import { buildStatusChallenge, parseBasicAuthHeader, verifyStatusAuth } from '@/lib/status/auth';

const originalUser = process.env.STATUS_USER;
const originalPass = process.env.STATUS_PASS;

function restoreEnv() {
  if (originalUser === undefined) {
    delete process.env.STATUS_USER;
  } else {
    process.env.STATUS_USER = originalUser;
  }

  if (originalPass === undefined) {
    delete process.env.STATUS_PASS;
  } else {
    process.env.STATUS_PASS = originalPass;
  }
}

function makeHeader(user: string, password: string) {
  const encoded = Buffer.from(`${user}:${password}`).toString('base64');
  return `Basic ${encoded}`;
}

beforeEach(() => {
  process.env.STATUS_USER = 'ops-user';
  process.env.STATUS_PASS = 'strong-pass';
});

afterEach(() => {
  restoreEnv();
});

describe('parseBasicAuthHeader', () => {
  it('returns parsed credentials for a valid header', () => {
    const header = makeHeader('ops-user', 'strong-pass');
    expect(parseBasicAuthHeader(header)).toEqual({ user: 'ops-user', password: 'strong-pass' });
  });

  it('returns null for non-basic schemes', () => {
    expect(parseBasicAuthHeader('Bearer token')).toBeNull();
  });

  it('returns null for malformed values', () => {
    expect(parseBasicAuthHeader('Basic not-base64')).toBeNull();
    expect(parseBasicAuthHeader('Basic ')).toBeNull();
  });
});

describe('verifyStatusAuth', () => {
  it('accepts valid credentials', () => {
    const header = makeHeader('ops-user', 'strong-pass');
    expect(verifyStatusAuth(header)).toEqual({ ok: true, user: 'ops-user' });
  });

  it('rejects invalid credentials', () => {
    const header = makeHeader('ops-user', 'wrong-pass');
    expect(verifyStatusAuth(header)).toEqual({ ok: false });
  });

  it('rejects when env credentials are missing', () => {
    delete process.env.STATUS_USER;
    delete process.env.STATUS_PASS;
    const header = makeHeader('ops-user', 'strong-pass');
    expect(verifyStatusAuth(header)).toEqual({ ok: false });
  });
});

describe('buildStatusChallenge', () => {
  it('includes the expected realm', () => {
    const challenge = buildStatusChallenge();
    expect(challenge).toMatch(/Basic realm="Louhen Ops"/);
    expect(challenge).toMatch(/charset="UTF-8"/);
  });
});
