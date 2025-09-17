import { createHash } from 'crypto';

export function emailHash(email: string, salt?: string): string {
  const s = (salt || process.env.EMAIL_HASH_SALT || '').trim();
  const value = String(email || '').trim().toLowerCase();
  const h = createHash('sha256');
  h.update(s);
  h.update('|');
  h.update(value);
  return h.digest('hex');
}

