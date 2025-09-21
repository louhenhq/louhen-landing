'use client';

import { useEffect, useRef } from 'react';
import { cn, layout, shadows, text } from '@/app/(site)/_lib/ui';
import { useTranslations } from 'next-intl';
import { observeOnce, track } from '@/lib/clientAnalytics';

type TestimonialItem = {
  name: string;
  meta: string;
  quote: string;
};

export default function TestimonialCards() {
  const t = useTranslations('trust.testimonials');
  const items = t.raw('items') as TestimonialItem[];
  const cardRefs = useRef<(HTMLLIElement | null)[]>([]);
  const cleanups = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    cleanups.current.forEach((dispose) => dispose());
    cleanups.current = [];

    cardRefs.current.forEach((node, index) => {
      if (!node) return;
      const dispose = observeOnce(node, () => track({ name: 'testimonial_view', ix: index as 0 | 1 | 2 }), 0.4);
      cleanups.current.push(dispose);
    });

    return () => {
      cleanups.current.forEach((dispose) => dispose());
      cleanups.current = [];
    };
  }, []);

  return (
    <section className={layout.section}>
      <div className={cn(layout.container, 'flex flex-col gap-8')}>
        <div className="max-w-2xl">
          <h2 className={text.heading}>{t('title')}</h2>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          {items.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              className={cn(layout.card, shadows.soft, 'flex h-full flex-col gap-sm rounded-2xl p-lg')}
              data-testid="testimonial-card"
            >
              <p className="text-sm font-medium text-text">{item.name}</p>
              <p className="text-xs uppercase tracking-wide text-text-muted">{item.meta}</p>
              <p className={text.body}>{item.quote}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
