export function isPrelaunch(): boolean {
  const explicit = process.env.IS_PRELAUNCH?.trim();
  if (explicit === 'true' || explicit === '1') {
    return true;
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv) {
    return vercelEnv !== 'production';
  }

  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  return nodeEnv !== 'production';
}
