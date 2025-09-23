import { Buffer } from 'node:buffer';
import { timingSafeEqual } from 'node:crypto';

export const STATUS_REALM = 'Louhen Ops';

type ParsedCredentials = {
  user: string;
  password: string;
};

type AuthResult = {
  ok: boolean;
  user?: string;
};

function constantTimeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, 'utf8');
  const bBuffer = Buffer.from(b, 'utf8');

  if (aBuffer.length !== bBuffer.length) {
    const length = Math.max(aBuffer.length, bBuffer.length, 1);
    const paddedA = Buffer.alloc(length, 0);
    const paddedB = Buffer.alloc(length, 0);
    aBuffer.copy(paddedA);
    bBuffer.copy(paddedB);
    timingSafeEqual(paddedA, paddedB);
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

function getConfiguredCredentials(): ParsedCredentials | null {
  const user = process.env.STATUS_USER;
  const password = process.env.STATUS_PASS;
  if (!user || !password) {
    return null;
  }
  return { user, password };
}

export function buildStatusChallenge(): string {
  return `Basic realm="${STATUS_REALM}", charset="UTF-8"`;
}

export function parseBasicAuthHeader(header: string | null | undefined): ParsedCredentials | null {
  if (!header) return null;

  const value = header.trim();
  if (!value) return null;

  const [scheme, encoded] = value.split(/\s+/, 2);
  if (!encoded || scheme.toLowerCase() !== 'basic') {
    return null;
  }

  let decoded: string;
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return null;
  }

  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) {
    return null;
  }

  const user = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  return { user, password };
}

export function verifyStatusAuth(header: string | null | undefined): AuthResult {
  const configured = getConfiguredCredentials();
  const provided = parseBasicAuthHeader(header);

  if (!configured || !provided) {
    return { ok: false };
  }

  const userMatches = constantTimeEqual(provided.user, configured.user);
  const passMatches = constantTimeEqual(provided.password, configured.password);

  if (userMatches && passMatches) {
    return { ok: true, user: provided.user };
  }

  return { ok: false };
}
