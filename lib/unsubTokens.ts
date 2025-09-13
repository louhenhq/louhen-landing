import { randomBytes } from 'crypto';

export function generateUnsubToken(bytes: number = 24) {
  return randomBytes(bytes).toString('base64url');
}

