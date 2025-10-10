import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const STORAGE_DIR = path.resolve(process.cwd(), '.playwright');
const STORAGE_FILE = path.join(STORAGE_DIR, 'auth-storage.json');

export default async function globalSetup() {
  const cookieEnv = process.env.PROTECTION_COOKIE;
  if (!cookieEnv) {
    return;
  }

  const base = process.env.BASE_URL ?? process.env.PREVIEW_BASE_URL ?? 'http://localhost:4311';
  const url = new URL(base.startsWith('http') ? base : `http://localhost:4311/${base}`);

  const cookies = cookieEnv
    .split(';')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [name, ...rest] = pair.split('=');
      return {
        name: name.trim(),
        value: rest.join('=').trim(),
        domain: url.hostname,
        path: '/',
      };
    })
    .filter((cookie) => cookie.name && cookie.value);

  if (!cookies.length) {
    return;
  }

  const storage = {
    cookies: cookies.map((cookie) => ({
      ...cookie,
      httpOnly: false,
      secure: url.protocol === 'https:',
      sameSite: 'Lax',
      expires: -1,
    })),
    origins: [],
  } as const;

  mkdirSync(STORAGE_DIR, { recursive: true });
  writeFileSync(STORAGE_FILE, JSON.stringify(storage), 'utf-8');
}
