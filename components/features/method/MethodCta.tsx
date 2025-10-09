'use client';

import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { Button } from '@/components/ui';
import type { SupportedLocale } from '@/next-intl.locales';
import { useMethodExperience } from './MethodExperienceProvider';

type MethodCtaProps = {
  locale: SupportedLocale;
};

export default function MethodCta({ locale }: MethodCtaProps) {
  const t = useTranslations('method.cta');
  const { registerCtaInteraction } = useMethodExperience();
  const handleClick = () => {
    registerCtaInteraction();
  };

  return (
    <section
      data-ll="method-footer-cta"
      className={cn(layout.section, 'bg-brand-primary/10')}
      aria-labelledby="method-cta-title"
    >
      <div className={cn(layout.container, 'flex flex-col items-center gap-md text-center')}>
        <h2 id="method-cta-title" className={cn(text.heading, 'text-balance')}>
          {t('title')}
        </h2>
        <Button
          as="a"
          href={`/${locale}/waitlist`}
          aria-label={t('button')}
          prefetch={false}
          onClick={handleClick}
          data-ll="method-hero-cta"
        >
          {t('final')}
        </Button>
      </div>
    </section>
  );
}
