import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

const TOKEN_LENGTH_BYTES = 32;
const SALT_LENGTH_BYTES = 16;

export function generateToken(): string {
  return randomBytes(TOKEN_LENGTH_BYTES).toString('base64url');
}

export function createTokenLookupHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hashToken(token: string, salt?: string): { hash: string; salt: string; lookupHash: string } {
  const effectiveSalt = salt ?? randomBytes(SALT_LENGTH_BYTES).toString('base64url');
  const lookupHash = createTokenLookupHash(token);
  const hash = createHash('sha256').update(`${effectiveSalt}:${token}`).digest('hex');
  return { hash, salt: effectiveSalt, lookupHash };
}

export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  try {
    return timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}
