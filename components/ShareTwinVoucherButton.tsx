'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { buttons } from '@/app/(site)/_lib/ui';
import { track } from '@/lib/clientAnalytics';

const SHARE_URL = 'https://louhen-app.com?code=TWINS5&utm_source=share&utm_medium=native&utm_campaign=twins5';

type ShareTwinVoucherButtonProps = {
  className?: string;
};

export default function ShareTwinVoucherButton({ className }: ShareTwinVoucherButtonProps) {
  const t = useTranslations('voucher.share');
  const message = t('message', { url: SHARE_URL });
  const shareTitle = t('cta');

  const handleFallbackShare = useCallback(() => {
    track({ name: 'voucher_share_whatsapp_click' });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }, [message]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: shareTitle,
      text: message,
      url: SHARE_URL,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        track({ name: 'voucher_share_native_success' });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    handleFallbackShare();
  }, [handleFallbackShare, message, shareTitle]);

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`${buttons.secondary} ${className ?? ''}`.trim()}
      aria-label={t('aria')}
    >
      {t('cta')}
    </button>
  );
}
