import { createHash } from 'crypto';

export function hashIp(ip: string | null | undefined, salt?: string): string | null {
  if (!ip) return null;
  const s = salt || process.env.ANALYTICS_IP_SALT || '';
  const h = createHash('sha256');
  h.update(s);
  h.update('|');
  h.update(ip);
  return h.digest('hex').slice(0, 40); // shorten for readability
}

