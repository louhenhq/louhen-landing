'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ShareTwinVoucherButton from '@/components/ShareTwinVoucherButton';
import { badges, buttons, cn, layout, shadows, text } from '@/app/(site)/_lib/ui';
import { useTranslations } from 'next-intl';
import { track } from '@/lib/clientAnalytics';

export default function FounderStoryWithVoucher() {
  const t = useTranslations('founder');
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText('TWINS5');
      track({ name: 'voucher_code_copy', code: 'TWINS5' });
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // best-effort clipboard copy
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-md text-text">
        <h2 className={text.heading}>{t('headline')}</h2>
        <p className={text.body}>{t('p1')}</p>
        <p className={text.body}>{t('p2')}</p>
        <p className={text.body}>{t('p3')}</p>
      </div>

      <div className={cn(layout.card, shadows.soft, 'flex flex-col gap-md rounded-2xl p-lg')}>
        <span className={`${badges.pill} w-fit bg-brand-teal/10 text-brand-teal`}>
          <span aria-hidden="true">👶👶</span>
          <span>{t('voucher.badge')}</span>
        </span>

        <div className="flex flex-col gap-xs">
          <h3 className="text-h3 text-text">{t('voucher.headline')}</h3>
          <p className={text.body}>{t('voucher.body')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-sm rounded-xl border border-border bg-bg px-md py-sm">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-xs rounded-xl border border-dashed border-border-strong bg-bg-card px-md py-2 font-mono text-label tracking-[0.3em] text-text transition-colors duration-base hover:border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            aria-label={t('voucher.copyAria')}
          >
            TWINS5
          </button>
          <span className="text-body-sm text-text-muted">{t('voucher.hint')}</span>
          <span className="text-body-sm text-status-success" role="status" aria-live="polite">
            {copied ? t('voucher.copied') : ''}
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a href="#waitlist" className={`${buttons.primary} w-full sm:w-auto`}>
            {t('voucher.cta')}
          </a>
          <ShareTwinVoucherButton className="w-full sm:w-auto" />
        </div>

        <p className="text-body-sm text-text-muted">{t('voucher.tc')}</p>
      </div>
    </div>
  );
}
