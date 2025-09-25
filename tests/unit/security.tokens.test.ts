import { describe, expect, it } from 'vitest';
import { constantTimeEquals, createTokenLookupHash, generateToken, hashToken } from '@/lib/security/tokens';

describe('security tokens', () => {
  it('generates high-entropy base64url tokens', () => {
    const tokenA = generateToken();
    const tokenB = generateToken();

    expect(tokenA).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(tokenA.length).toBeGreaterThanOrEqual(40);
    expect(tokenA).not.toBe(tokenB);
  });

  it('hashes tokens with salt and lookup hash', () => {
    const token = generateToken();
    const { hash, salt } = hashToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(salt).toMatch(/^[A-Za-z0-9_-]+$/);

    const repeat = hashToken(token, salt);
    expect(repeat.hash).toBe(hash);
    expect(repeat.salt).toBe(salt);
    expect(repeat.lookupHash).toBe(createTokenLookupHash(token));
  });

  it('creates deterministic lookup hashes', () => {
    const token = 'test-token';
    expect(createTokenLookupHash(token)).toBe(createTokenLookupHash(token));
  });

  it('compares tokens using constant-time equality', () => {
    const token = generateToken();
    const match = constantTimeEquals(token, token);
    const mismatch = constantTimeEquals(token, `${token}a`);
    const diffLength = constantTimeEquals('short', 'longer');

    expect(match).toBe(true);
    expect(mismatch).toBe(false);
    expect(diffLength).toBe(false);
  });
});
