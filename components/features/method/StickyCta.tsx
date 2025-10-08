'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/app/(site)/_lib/ui';
import { Button } from '@/components/ui';
import { useMethodExperience } from './MethodExperienceProvider';

type StickyCtaProps = {
  locale: string;
};

export default function StickyCta({ locale }: StickyCtaProps) {
  const { registerCtaInteraction, hasClickedCta } = useMethodExperience();
  const t = useTranslations('method.cta');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasClickedCta) {
      setVisible(false);
      return;
    }
    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        setVisible(false);
        return;
      }
      const ratio = window.scrollY / scrollable;
      setVisible(ratio >= 0.25);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasClickedCta]);

  if (!visible || hasClickedCta) return null;

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0)+1rem)] pt-3',
        'md:hidden'
      )}
      data-testid="method-sticky-cta"
    >
      <div className="rounded-2xl bg-brand-primary/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-brand-primary/80">
        <Button
          as="a"
          href={`/${locale}/waitlist`}
          aria-label={t('button')}
          prefetch={false}
          onClick={() => registerCtaInteraction('sticky')}
          className="w-full"
        >
          {t('button')}
        </Button>
      </div>
    </div>
  );
}
