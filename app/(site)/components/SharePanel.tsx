'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SupportedLocale } from '@/next-intl.locales';
import { track } from '@/lib/clientAnalytics';
import { buttons, cn, text } from '@/app/(site)/_lib/ui';

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
        <div className="rounded-3xl border border-border bg-bg-card px-gutter py-2xl shadow-card flex flex-col gap-lg">
          <section className="flex flex-col gap-sm" aria-live="polite">
            <span className="text-xs text-text-muted uppercase tracking-wide">{copy.linkLabel}</span>
            <div className="rounded-2xl border border-border bg-bg px-md py-sm text-sm text-text break-all">
              {shareUrl || copy.codePending}
            </div>
            <div className="flex flex-wrap gap-sm">
              <button
                type="button"
                className={cn(buttons.primary, 'px-lg py-sm')}
                onClick={() => copyToClipboard(shareUrl, 'wl_share_copy_link')}
                disabled={!shareUrl}
              >
                {copy.copyLink}
              </button>
              <button
                type="button"
                className={cn(buttons.secondary, 'px-lg py-sm')}
                onClick={() => copyToClipboard(displayCode, 'wl_share_copy_code')}
                disabled={!displayCode}
              >
                {copy.copyCode}
              </button>
              <button
                type="button"
                className={cn(buttons.secondary, 'px-lg py-sm')}
                onClick={handleNativeShare}
                disabled={!supportsNativeShare || !shareUrl}
              >
                {copy.nativeShare}
              </button>
            </div>
            {copyFeedback && <p className="text-sm text-status-success" aria-live="polite">{copyFeedback}</p>}
            <p className="text-xs text-text-muted">{copy.assurance}</p>
          </section>
          <section className="flex flex-col gap-sm">
            <span className="text-xs text-text-muted uppercase tracking-wide">{copy.codeLabel}</span>
            <div className="rounded-2xl border border-border bg-bg px-md py-sm text-lg font-semibold tracking-[0.3em] text-center">
              {displayCode || copy.codePending}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default SharePanel;
