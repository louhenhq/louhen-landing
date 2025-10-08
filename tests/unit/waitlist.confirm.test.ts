import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({
  findByTokenHash: vi.fn(),
  markConfirmedByTokenHash: vi.fn(),
  markExpiredByTokenHash: vi.fn(),
}));

vi.mock('@/lib/firestore/waitlist', () => firestoreMocks);

import { hashToken } from '@/lib/security/tokens';
import { processConfirmationToken } from '@/lib/waitlist/confirm';

describe('processConfirmationToken', () => {
  beforeEach(() => {
    firestoreMocks.findByTokenHash.mockReset();
    firestoreMocks.markConfirmedByTokenHash.mockReset();
    firestoreMocks.markExpiredByTokenHash.mockReset();
  });

  it('rejects invalid tokens', async () => {
    await expect(processConfirmationToken('')).resolves.toEqual({ status: 'invalid' });
    await expect(processConfirmationToken('short')).resolves.toEqual({ status: 'invalid' });
  });

  it('handles missing records', async () => {
    firestoreMocks.findByTokenHash.mockResolvedValueOnce(null);
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toEqual({ status: 'not_found' });
  });

  it('handles already confirmed records', async () => {
    firestoreMocks.findByTokenHash.mockResolvedValueOnce({
      status: 'confirmed',
      confirmSalt: null,
      confirmTokenHash: null,
      confirmExpiresAt: new Date(Date.now() + 1000),
      id: 'doc-confirmed',
      locale: 'en',
    });
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toMatchObject({ status: 'already', docId: 'doc-confirmed' });
  });

  it('expires tokens when record status expired', async () => {
    firestoreMocks.findByTokenHash.mockResolvedValueOnce({
      status: 'expired',
      confirmSalt: null,
      confirmTokenHash: null,
      confirmExpiresAt: new Date(Date.now() - 1000),
      id: 'doc-expired',
      locale: 'en',
    });
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toMatchObject({ status: 'expired', docId: 'doc-expired' });
  });

  it('expires tokens when link is past ttl', async () => {
    firestoreMocks.findByTokenHash.mockResolvedValueOnce({
      status: 'pending',
      confirmSalt: 'salt',
      confirmTokenHash: 'hash',
      confirmExpiresAt: new Date(Date.now() - 1000),
      id: 'doc-ttl',
      locale: null,
    });
    firestoreMocks.markExpiredByTokenHash.mockResolvedValueOnce('expired');
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toMatchObject({ status: 'expired', docId: 'doc-ttl' });
    expect(firestoreMocks.markExpiredByTokenHash).toHaveBeenCalled();
  });

  it('expires tokens when hashes do not match', async () => {
    firestoreMocks.findByTokenHash.mockResolvedValueOnce({
      status: 'pending',
      confirmSalt: 'salt',
      confirmTokenHash: 'different',
      confirmExpiresAt: new Date(Date.now() + 1000),
      id: 'doc-mismatch',
      locale: 'de',
    });
    firestoreMocks.markExpiredByTokenHash.mockResolvedValueOnce('expired');
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toMatchObject({ status: 'expired', docId: 'doc-mismatch', locale: 'de' });
  });

  it('confirms tokens when hashes match', async () => {
    const token = 't'.repeat(40);
    const hashed = hashToken(token, 'salt');
    firestoreMocks.findByTokenHash.mockResolvedValueOnce({
      status: 'pending',
      confirmSalt: 'salt',
      confirmTokenHash: hashed.hash,
      confirmExpiresAt: new Date(Date.now() + 1000),
      id: 'doc-confirm',
      locale: 'en',
    });
    firestoreMocks.markConfirmedByTokenHash.mockResolvedValueOnce('confirmed');

    await expect(processConfirmationToken(token)).resolves.toMatchObject({ status: 'confirmed', docId: 'doc-confirm', locale: 'en' });
    expect(firestoreMocks.markConfirmedByTokenHash).toHaveBeenCalled();
  });
});
