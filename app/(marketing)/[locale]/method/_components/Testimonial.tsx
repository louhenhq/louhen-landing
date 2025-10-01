'use client';

import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';

export default function Testimonial() {
  const t = useTranslations('method.testimonial');

  return (
    <section className={cn(layout.section, 'bg-bg')} aria-labelledby="method-testimonial-title">
      <div className={cn(layout.container, 'flex flex-col gap-md')}>
        <h2 id="method-testimonial-title" className={cn(text.heading, 'text-2xl md:text-3xl')}>
          {t('attribution')}
        </h2>
        <blockquote className={cn(layout.card, 'px-gutter py-xl text-lg font-medium leading-relaxed text-text')}>
          {t('quote')}
        </blockquote>
      </div>
    </section>
  );
}
