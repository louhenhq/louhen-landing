'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui';
import TrustSchema from '@components/TrustSchema';

export default function MethodTrustLayer() {
  const t = useTranslations('method.trust');

  return (
    <section
      data-testid="method-trust-layer"
      data-ll="method-trust"
      className="bg-bg"
      aria-labelledby="method-trust-title"
    >
      <div className="mx-auto flex w-full max-w-[min(100%,var(--layout-max-width))] flex-col gap-2xl px-gutter py-3xl">
        <header className="flex flex-col gap-sm">
          <span className="inline-flex w-fit items-center gap-xs rounded-pill border border-border bg-bg px-sm py-xs text-body-sm font-medium text-text">
            {t('badge')}
          </span>
          <h2 id="method-trust-title" className="text-display-lg text-text">
            {t('headline')}
          </h2>
          <p className="text-body text-text-muted">{t('body')}</p>
        </header>
        <figure className="contents">
          <Card
            data-testid="method-trust-quote"
            className="flex flex-col gap-sm px-xl py-xl"
          >
            <blockquote className="text-body font-medium text-text">
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
