import { findByTokenHash, markConfirmedByTokenHash, markExpiredByTokenHash } from '@/lib/firestore/waitlist';
import { constantTimeEquals, createTokenLookupHash, hashToken } from '@/lib/security/tokens';

export type ConfirmResult = 'confirmed' | 'already' | 'expired' | 'not_found' | 'invalid';

export type ConfirmOutcome = {
  status: ConfirmResult;
  docId?: string;
  locale?: string | null;
};

export async function processConfirmationToken(rawToken: string | null | undefined): Promise<ConfirmOutcome> {
  const token = typeof rawToken === 'string' ? rawToken.trim() : '';
  if (!token || token.length < 20) {
    return { status: 'invalid' };
  }

  const lookupHash = createTokenLookupHash(token);
  const record = await findByTokenHash(lookupHash);
  if (!record) {
    return { status: 'not_found' };
  }

  const context = { docId: record.id, locale: record.locale ?? null };

  if (record.status === 'confirmed') {
    return { status: 'already', ...context };
  }

  if (record.status === 'expired') {
    return { status: 'expired', ...context };
  }

  const expiresAt = record.confirmExpiresAt;
  if (!expiresAt || Date.now() > expiresAt.getTime()) {
    await markExpiredByTokenHash(lookupHash);
    return { status: 'expired', ...context };
  }

  if (!record.confirmSalt || !record.confirmTokenHash) {
    await markExpiredByTokenHash(lookupHash);
    return { status: 'expired', ...context };
  }

  const hashed = hashToken(token, record.confirmSalt).hash;
  const matches = constantTimeEquals(hashed, record.confirmTokenHash);
  if (!matches) {
    await markExpiredByTokenHash(lookupHash);
    return { status: 'expired', ...context };
  }

  const confirmationResult = await markConfirmedByTokenHash(lookupHash);
  if (confirmationResult === 'confirmed') {
    return { status: 'confirmed', ...context };
  }
  if (confirmationResult === 'already') {
    return { status: 'already', ...context };
  }
  if (confirmationResult === 'expired') {
    return { status: 'expired', ...context };
  }
  return { status: 'not_found' };
}
