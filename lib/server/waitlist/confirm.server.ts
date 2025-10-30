import 'server-only';

import { findByTokenHash, markConfirmedByTokenHash, markExpiredByTokenHash } from '@server/waitlist/firestore.server';
import { constantTimeEquals, createTokenLookupHash, hashToken } from '@/lib/security/tokens';

export type ConfirmResult = 'confirmed' | 'already' | 'expired' | 'not_found' | 'invalid';

export async function processConfirmationToken(rawToken: string | null | undefined): Promise<ConfirmResult> {
  const token = typeof rawToken === 'string' ? rawToken.trim() : '';
  if (!token || token.length < 20) {
    return 'invalid';
  }

  const lookupHash = createTokenLookupHash(token);
  const record = await findByTokenHash(lookupHash);
  if (!record) {
    return 'not_found';
  }

  if (record.status === 'confirmed') {
    return 'already';
  }

  if (record.status === 'expired') {
    return 'expired';
  }

  const expiresAt = record.confirmExpiresAt;
  if (!expiresAt || Date.now() > expiresAt.getTime()) {
    await markExpiredByTokenHash(lookupHash);
    return 'expired';
  }

  if (!record.confirmSalt || !record.confirmTokenHash) {
    await markExpiredByTokenHash(lookupHash);
    return 'expired';
  }

  const hashed = hashToken(token, record.confirmSalt).hash;
  const matches = constantTimeEquals(hashed, record.confirmTokenHash);
  if (!matches) {
    await markExpiredByTokenHash(lookupHash);
    return 'expired';
  }

  const confirmationResult = await markConfirmedByTokenHash(lookupHash);
  if (confirmationResult === 'confirmed') {
    return 'confirmed';
  }
  if (confirmationResult === 'already') {
    return 'already';
  }
  if (confirmationResult === 'expired') {
    return 'expired';
  }
  return 'not_found';
}
