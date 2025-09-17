import { randomBytes, createHash } from 'crypto';

export function randomTokenBase64Url(bytes = 32): string {
  // Base64url: replace +/ with -_, trim padding
  return randomBytes(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

