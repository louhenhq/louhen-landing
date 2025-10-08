'use client';

import { useEffect, useRef } from 'react';
import { cn, layout, shadows, text } from '@/app/(site)/_lib/ui';
import { useTranslations } from 'next-intl';
import { observeOnce, track } from '@/lib/clientAnalytics';

function visibleRatio(node: Element): number {
  const rect = node.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

  if (rect.height <= 0 || rect.width <= 0) {
    return 0;
  }

  const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
  const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
  const clampedHeight = Math.max(0, visibleHeight);
  const clampedWidth = Math.max(0, visibleWidth);

  const visibleArea = clampedHeight * clampedWidth;
  const totalArea = rect.height * rect.width;
  return totalArea > 0 ? visibleArea / totalArea : 0;
}

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

    const threshold = 0.35;

    cardRefs.current.forEach((node, index) => {
      if (!node) return;

      if (visibleRatio(node) >= threshold) {
        void track({ name: 'testimonial_view', ix: index as 0 | 1 | 2 });
        return;
      }

      const dispose = observeOnce(
        node,
        () => {
          void track({ name: 'testimonial_view', ix: index as 0 | 1 | 2 });
        },
        threshold
      );

      cleanups.current.push(dispose);
    });

    return () => {
      cleanups.current.forEach((dispose) => dispose());
      cleanups.current = [];
    };
  }, []);

  return (
    <section className={layout.section}>
      <div className={cn(layout.container, layout.grid, 'gap-y-xl')}>
        <div className="md:col-span-4 lg:col-span-4">
          <h2 className={text.heading}>{t('title')}</h2>
        </div>
        <ol className="md:col-span-8 lg:col-span-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              className={cn(layout.card, shadows.soft, 'flex h-full flex-col gap-sm rounded-2xl p-lg')}
              data-testid="testimonial-card"
            >
              <p className="text-label text-text">{item.name}</p>
              <p className="text-meta uppercase tracking-[0.24em] text-text-muted">{item.meta}</p>
              <p className={text.body}>{item.quote}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
