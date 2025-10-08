'use client';

import { useTranslations } from 'next-intl';
import { badges, cn, layout, text } from '@/app/(site)/_lib/ui';
import TrustSchema from '@components/TrustSchema';

export default function MethodTrustLayer() {
  const t = useTranslations('method.trust');

  return (
    <section
      data-ll="method-trust"
      className={cn(layout.section, 'bg-bg')}
      aria-labelledby="method-trust-title"
    >
      <div className={cn(layout.container, 'flex flex-col gap-xl')}>
        <div className="flex flex-col gap-sm">
          <span className={badges.pill}>{t('badge')}</span>
          <h2 id="method-trust-title" className={text.heading}>
            {t('headline')}
          </h2>
          <p className={text.body}>{t('body')}</p>
        </div>
        <figure className="contents">
          <Card className="flex flex-col gap-sm px-gutter py-xl">
            <blockquote className="text-body text-text font-medium">
              {t('quote')}
            </blockquote>
            <figcaption className="text-meta text-text-muted">{t('attribution')}</figcaption>
          </Card>
        </figure>
        <TrustSchema />
      </div>
    </section>
  );
}
