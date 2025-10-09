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
<<<<<<< HEAD
    await expect(processConfirmationToken('')).resolves.toEqual({ status: 'invalid' });
    await expect(processConfirmationToken('short')).resolves.toEqual({ status: 'invalid' });
=======
    await expect(processConfirmationToken('')).resolves.toBe('invalid');
    await expect(processConfirmationToken('short')).resolves.toBe('invalid');
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  });

  it('handles missing records', async () => {
    firestoreMocks.findByTokenHash.mockResolvedValueOnce(null);
<<<<<<< HEAD
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toEqual({ status: 'not_found' });
=======
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toBe('not_found');
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  });

  it('handles already confirmed records', async () => {
    firestoreMocks.findByTokenHash.mockResolvedValueOnce({
      status: 'confirmed',
      confirmSalt: null,
      confirmTokenHash: null,
      confirmExpiresAt: new Date(Date.now() + 1000),
<<<<<<< HEAD
      id: 'doc-confirmed',
      locale: 'en',
    });
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toMatchObject({ status: 'already', docId: 'doc-confirmed' });
=======
    });
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toBe('already');
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  });

  it('expires tokens when record status expired', async () => {
    firestoreMocks.findByTokenHash.mockResolvedValueOnce({
      status: 'expired',
      confirmSalt: null,
      confirmTokenHash: null,
      confirmExpiresAt: new Date(Date.now() - 1000),
<<<<<<< HEAD
      id: 'doc-expired',
      locale: 'en',
    });
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toMatchObject({ status: 'expired', docId: 'doc-expired' });
=======
    });
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toBe('expired');
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  });

  it('expires tokens when link is past ttl', async () => {
    firestoreMocks.findByTokenHash.mockResolvedValueOnce({
      status: 'pending',
      confirmSalt: 'salt',
      confirmTokenHash: 'hash',
      confirmExpiresAt: new Date(Date.now() - 1000),
<<<<<<< HEAD
      id: 'doc-ttl',
      locale: null,
    });
    firestoreMocks.markExpiredByTokenHash.mockResolvedValueOnce('expired');
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toMatchObject({ status: 'expired', docId: 'doc-ttl' });
=======
    });
    firestoreMocks.markExpiredByTokenHash.mockResolvedValueOnce('expired');
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toBe('expired');
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
    expect(firestoreMocks.markExpiredByTokenHash).toHaveBeenCalled();
  });

  it('expires tokens when hashes do not match', async () => {
    firestoreMocks.findByTokenHash.mockResolvedValueOnce({
      status: 'pending',
      confirmSalt: 'salt',
      confirmTokenHash: 'different',
      confirmExpiresAt: new Date(Date.now() + 1000),
<<<<<<< HEAD
      id: 'doc-mismatch',
      locale: 'de',
    });
    firestoreMocks.markExpiredByTokenHash.mockResolvedValueOnce('expired');
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toMatchObject({ status: 'expired', docId: 'doc-mismatch', locale: 'de' });
=======
    });
    firestoreMocks.markExpiredByTokenHash.mockResolvedValueOnce('expired');
    await expect(processConfirmationToken('a'.repeat(32))).resolves.toBe('expired');
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  });

  it('confirms tokens when hashes match', async () => {
    const token = 't'.repeat(40);
    const hashed = hashToken(token, 'salt');
    firestoreMocks.findByTokenHash.mockResolvedValueOnce({
      status: 'pending',
      confirmSalt: 'salt',
      confirmTokenHash: hashed.hash,
      confirmExpiresAt: new Date(Date.now() + 1000),
<<<<<<< HEAD
      id: 'doc-confirm',
      locale: 'en',
    });
    firestoreMocks.markConfirmedByTokenHash.mockResolvedValueOnce('confirmed');

    await expect(processConfirmationToken(token)).resolves.toMatchObject({ status: 'confirmed', docId: 'doc-confirm', locale: 'en' });
=======
    });
    firestoreMocks.markConfirmedByTokenHash.mockResolvedValueOnce('confirmed');

    await expect(processConfirmationToken(token)).resolves.toBe('confirmed');
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
    expect(firestoreMocks.markConfirmedByTokenHash).toHaveBeenCalled();
  });
});
