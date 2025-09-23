import type { SuppressionScope } from '@/lib/email/suppress';
import { buildUnsubUrl } from '@/lib/email/tokens';

const DEFAULT_UNSUBSCRIBE_MAILTO = 'unsubscribe@louhen.eu';

type HeaderOptions = {
  email?: string;
  scope?: SuppressionScope;
  unsubscribeMailto?: string;
  unsubscribeUrl?: string;
  marketing?: boolean;
  replyTo?: string | null;
  autoSubmitted?: boolean;
};

const DEFAULT_REPLY_TO = process.env.RESEND_REPLY_TO?.trim() || 'support@louhen.eu';

export function buildStandardHeaders(options: HeaderOptions = {}): Record<string, string> {
  const {
    email,
    scope = 'all',
    unsubscribeMailto,
    unsubscribeUrl,
    marketing = false,
    replyTo = DEFAULT_REPLY_TO,
    autoSubmitted = true,
  } = options;

  const headers: Record<string, string> = {};

  const resolvedUnsubUrl = unsubscribeUrl ?? (email ? buildUnsubUrl(email, scope) : undefined);
  const resolvedMailto = unsubscribeMailto ?? DEFAULT_UNSUBSCRIBE_MAILTO;

  if (resolvedMailto || resolvedUnsubUrl) {
    const parts: string[] = [];
    if (resolvedMailto) {
      const value = resolvedMailto.startsWith('mailto:') ? resolvedMailto : `mailto:${resolvedMailto}`;
      parts.push(`<${value}>`);
    }
    if (resolvedUnsubUrl) {
      parts.push(`<${resolvedUnsubUrl}>`);
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }
    headers['List-Unsubscribe'] = parts.join(', ');
  }

  if (autoSubmitted) {
    headers['Auto-Submitted'] = 'auto-generated';
  }

  if (marketing) {
    headers.Precedence = 'bulk';
  }

  if (replyTo) {
    headers['Reply-To'] = replyTo;
  }

  return headers;
}
