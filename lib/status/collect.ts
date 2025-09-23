import { parseConsentCookie } from '@/lib/consent/cookie';
import { getEmailTransport } from '@/lib/email/transport';
import { getDb } from '@/lib/firebaseAdmin';

const startedAt = new Date();
const SUPPRESSIONS_SAMPLE_LIMIT = 20;

type ConsentSnapshot = {
  analytics: boolean | null;
  marketing: boolean | null;
  timestamp: string | null;
};

type EnvInfo = {
  vercelEnv: string | null;
  commitSha: string | null;
  appBaseUrl: string | null;
};

type StatusSnapshot = {
  timestamp: string;
  noncePresent: boolean;
  consent: ConsentSnapshot;
  emailTransport: 'noop' | 'resend';
  suppressionsCount: number | null;
  suppressionsSampleLimit: number;
  env: EnvInfo;
  uptime: {
    seconds: number;
    startedAt: string;
  };
};

async function countRecentSuppressions(): Promise<number | null> {
  try {
    const db = getDb();
    const snapshot = await db
      .collection('suppressions')
      .orderBy('updatedAt', 'desc')
      .limit(SUPPRESSIONS_SAMPLE_LIMIT)
      .get();
    return snapshot.size;
  } catch (error) {
    console.warn('[status:suppressions] unavailable', { message: error instanceof Error ? error.message : 'unknown error' });
    return null;
  }
}

function snapshotConsent(headers: Headers): ConsentSnapshot {
  const consent = parseConsentCookie(headers);
  if (!consent) {
    return {
      analytics: null,
      marketing: null,
      timestamp: null,
    };
  }

  return {
    analytics: Boolean(consent.analytics),
    marketing: Boolean(consent.marketing),
    timestamp: consent.timestamp,
  };
}

function resolveEnvInfo(): EnvInfo {
  const vercelEnv = process.env.VERCEL_ENV?.trim() || null;
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || process.env.COMMIT_SHA?.trim() || null;
  const appBaseUrl = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim() || null;

  return {
    vercelEnv,
    commitSha,
    appBaseUrl,
  };
}

export async function collectStatusSignals({ headers, fallbackNonce }: { headers: Headers; fallbackNonce?: string }): Promise<StatusSnapshot> {
  const nonceHeader = headers.get('x-csp-nonce') || fallbackNonce || '';
  const emailTransport = getEmailTransport().name;
  const suppressionsCount = await countRecentSuppressions();

  return {
    timestamp: new Date().toISOString(),
    noncePresent: Boolean(nonceHeader),
    consent: snapshotConsent(headers),
    emailTransport,
    suppressionsCount,
    suppressionsSampleLimit: SUPPRESSIONS_SAMPLE_LIMIT,
    env: resolveEnvInfo(),
    uptime: {
      seconds: Number(process.uptime().toFixed(3)),
      startedAt: startedAt.toISOString(),
    },
  };
}

export type { StatusSnapshot };
