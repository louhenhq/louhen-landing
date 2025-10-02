'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SupportedLocale } from '@/next-intl.locales';
import { track } from '@/lib/clientAnalytics';
import { cn, text } from '@/app/(site)/_lib/ui';
import { Button, Card } from '@/components/ui';

type ShareCopy = {
  title: string;
  subtitle: string;
  linkLabel: string;
  codeLabel: string;
  copyLink: string;
  copyCode: string;
  copied: string;
  nativeShare: string;
  codePending: string;
  qr: string;
  assurance: string;
};

type Props = {
  locale: SupportedLocale;
  code: string | null;
  copy: ShareCopy;
};

function buildShareUrl(locale: SupportedLocale, code: string | null) {
  if (!code) return '';
  const path = `/${locale}?ref=${encodeURIComponent(code)}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  const envBase = process.env.NEXT_PUBLIC_SITE_URL;
  if (envBase) {
    return `${envBase.replace(/\/$/, '')}${path}`;
  }
  return path;
}

export function SharePanel({ locale, code, copy }: Props) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);
  const shareUrl = useMemo(() => buildShareUrl(locale, code), [locale, code]);

  useEffect(() => {
    track({ name: 'wl_share_view' });
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setSupportsNativeShare(true);
    }
  }, []);

  async function copyToClipboard(value: string, eventName: 'wl_share_copy_link' | 'wl_share_copy_code') {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback(copy.copied);
      setTimeout(() => setCopyFeedback(null), 2000);
      track({ name: eventName, method: 'button' });
    } catch (error) {
      console.error('clipboard copy failed', error);
    }
  }

  async function handleNativeShare() {
    if (!supportsNativeShare || !shareUrl) return;
    try {
      await navigator.share({ title: copy.title, text: copy.subtitle, url: shareUrl });
      track({ name: 'wl_share_native', supported: true });
    } catch {
      // user dismissed share sheet; no analytics event for failure per requirements
    }
  }

  const displayCode = code ?? '';

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex flex-col gap-sm text-center">
        <h1 className={cn(text.heading)}>{copy.title}</h1>
        <p className={cn(text.body, 'mx-auto max-w-2xl text-balance')}>{copy.subtitle}</p>
      </header>
      <div className="flex flex-col gap-lg">
        <Card className="flex flex-col gap-lg px-gutter py-2xl">
          <section className="flex flex-col gap-sm" aria-live="polite">
            <span className={cn(text.meta, 'text-text-muted')}>{copy.linkLabel}</span>
            <div className="rounded-2xl border border-border bg-bg px-md py-sm text-body-sm text-text break-all">
              {shareUrl || copy.codePending}
            </div>
            <div className="flex flex-wrap gap-sm">
              <Button
                type="button"
                onClick={() => copyToClipboard(shareUrl, 'wl_share_copy_link')}
                disabled={!shareUrl}
              >
                {copy.copyLink}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => copyToClipboard(displayCode, 'wl_share_copy_code')}
                disabled={!displayCode}
              >
                {copy.copyCode}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleNativeShare}
                disabled={!supportsNativeShare || !shareUrl}
              >
                {copy.nativeShare}
              </Button>
            </div>
            {copyFeedback && <p className="text-body-sm text-status-success" aria-live="polite">{copyFeedback}</p>}
            <p className={cn(text.meta, 'text-text-muted normal-case tracking-normal')}>{copy.assurance}</p>
          </section>
          <section className="flex flex-col gap-sm">
            <span className={cn(text.meta, 'text-text-muted')}>{copy.codeLabel}</span>
            <div className="rounded-2xl border border-border bg-bg px-md py-sm text-h3 font-semibold tracking-[0.3em] text-center">
              {displayCode || copy.codePending}
            </div>
          </section>
        </Card>
      </div>
    </div>
  );
}

export default SharePanel;
