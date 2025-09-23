'use client';

import { useTranslations } from 'next-intl';
import { badges, cn, layout, text } from '@/app/(site)/_lib/ui';

export default function TrustLayer() {
  const t = useTranslations('method.trust');

  return (
    <section className={cn(layout.section, 'bg-bg')} aria-labelledby="method-trust-title">
      <div className={cn(layout.container, 'flex flex-col gap-xl')}>
        <div className="flex flex-col gap-sm">
          <span className={badges.pill}>{t('badge')}</span>
          <p id="method-trust-title" className={cn(text.subheading, 'text-text')}>
            {t('reassurance')}
          </p>
        </div>
        <figure className={cn(layout.card, 'flex flex-col gap-sm px-gutter py-xl')}>
          <blockquote className="text-lg font-medium leading-relaxed text-text">
            {t('quote')}
          </blockquote>
          <figcaption className="text-sm text-text-muted">{t('attribution')}</figcaption>
        </figure>
      </div>
    </section>
  );
}
