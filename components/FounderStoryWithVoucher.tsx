'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ShareTwinVoucherButton from '@/components/ShareTwinVoucherButton';
import { badges, text } from '@/app/(site)/_lib/ui';
import { useTranslations } from 'next-intl';
import { track } from '@/lib/clientAnalytics';
import { Button, Card } from '@/components/ui';

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

      <Card className="flex flex-col gap-md p-lg">
        <span className={`${badges.pill} w-fit bg-brand-teal/10 text-brand-teal`}>
          <span aria-hidden="true">👶👶</span>
          <span>{t('voucher.badge')}</span>
        </span>

        <div className="flex flex-col gap-xs">
          <h3 className="text-h3 text-text">{t('voucher.headline')}</h3>
          <p className={text.body}>{t('voucher.body')}</p>
        </div>

        <Card
          variant="outline"
          className="flex flex-wrap items-center gap-sm border-border px-md py-sm"
        >
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            aria-label={t('voucher.copyAria')}
            className="border-dashed font-mono tracking-[0.3em]"
          >
            TWINS5
          </Button>
          <span className="text-body-sm text-text-muted">{t('voucher.hint')}</span>
          <span className="text-body-sm text-status-success" role="status" aria-live="polite">
            {copied ? t('voucher.copied') : ''}
          </span>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button as="a" href="#waitlist" size="md" className="w-full sm:w-auto">
            {t('voucher.cta')}
          </Button>
          <ShareTwinVoucherButton className="w-full sm:w-auto" />
        </div>

        <p className="text-body-sm text-text-muted">{t('voucher.tc')}</p>
      </Card>
    </div>
  );
}
