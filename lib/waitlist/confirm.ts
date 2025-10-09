import { findByTokenHash, markConfirmedByTokenHash, markExpiredByTokenHash } from '@/lib/firestore/waitlist';
import { constantTimeEquals, createTokenLookupHash, hashToken } from '@/lib/security/tokens';

export type ConfirmResult = 'confirmed' | 'already' | 'expired' | 'not_found' | 'invalid';

<<<<<<< HEAD
export type ConfirmOutcome = {
  status: ConfirmResult;
  docId?: string;
  locale?: string | null;
};

export async function processConfirmationToken(rawToken: string | null | undefined): Promise<ConfirmOutcome> {
  const token = typeof rawToken === 'string' ? rawToken.trim() : '';
  if (!token || token.length < 20) {
    return { status: 'invalid' };
=======
export async function processConfirmationToken(rawToken: string | null | undefined): Promise<ConfirmResult> {
  const token = typeof rawToken === 'string' ? rawToken.trim() : '';
  if (!token || token.length < 20) {
    return 'invalid';
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  }

  const lookupHash = createTokenLookupHash(token);
  const record = await findByTokenHash(lookupHash);
  if (!record) {
<<<<<<< HEAD
    return { status: 'not_found' };
  }

  const context = { docId: record.id, locale: record.locale ?? null };

  if (record.status === 'confirmed') {
    return { status: 'already', ...context };
  }

  if (record.status === 'expired') {
    return { status: 'expired', ...context };
=======
    return 'not_found';
  }

  if (record.status === 'confirmed') {
    return 'already';
  }

  if (record.status === 'expired') {
    return 'expired';
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  }

  const expiresAt = record.confirmExpiresAt;
  if (!expiresAt || Date.now() > expiresAt.getTime()) {
    await markExpiredByTokenHash(lookupHash);
<<<<<<< HEAD
    return { status: 'expired', ...context };
=======
    return 'expired';
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  }

  if (!record.confirmSalt || !record.confirmTokenHash) {
    await markExpiredByTokenHash(lookupHash);
<<<<<<< HEAD
    return { status: 'expired', ...context };
=======
    return 'expired';
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  }

  const hashed = hashToken(token, record.confirmSalt).hash;
  const matches = constantTimeEquals(hashed, record.confirmTokenHash);
  if (!matches) {
    await markExpiredByTokenHash(lookupHash);
<<<<<<< HEAD
    return { status: 'expired', ...context };
=======
    return 'expired';
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
  }

  const confirmationResult = await markConfirmedByTokenHash(lookupHash);
  if (confirmationResult === 'confirmed') {
<<<<<<< HEAD
    return { status: 'confirmed', ...context };
  }
  if (confirmationResult === 'already') {
    return { status: 'already', ...context };
  }
  if (confirmationResult === 'expired') {
    return { status: 'expired', ...context };
  }
  return { status: 'not_found' };
=======
    return 'confirmed';
  }
  if (confirmationResult === 'already') {
    return 'already';
  }
  if (confirmationResult === 'expired') {
    return 'expired';
  }
  return 'not_found';
>>>>>>> f7d7592 (Waitlist env split: build uses NEXT_PUBLIC only (#2))
}
