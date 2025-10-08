'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';

type FAQItem = { q: string; a: string };

export default function FAQ() {
  const t = useTranslations('faq');
  const items = useMemo<FAQItem[]>(() => {
    const raw = t.raw('items') as Record<string, FAQItem> | undefined;
    return raw ? Object.values(raw) : [];
  }, [t]);

  return (
    <section id="faq" className={cn(layout.section, 'bg-bg')}>
      <div className={cn(layout.container, layout.grid, 'gap-y-xl')}>
        <div className="md:col-span-4 lg:col-span-4">
          <h2 className={text.heading}>{t('title')}</h2>
        </div>
        <div className="md:col-span-8 lg:col-span-8 flex flex-col gap-md">
          {items.map((item: FAQItem) => (
            <details key={item.q} className={cn(layout.card, 'group px-lg py-lg')}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-md">
                <span className="text-label text-text">{item.q}</span>
                <span className="text-label text-text-muted transition-transform duration-base group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-sm text-body text-text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
