'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { buttons, cn, layout, text } from '@/app/(site)/_lib/ui';

export default function FounderStory() {
  const t = useTranslations('founder');
  const [expanded, setExpanded] = useState(false);
  const fullBody = t('body');
  const preview = fullBody.split(' ').slice(0, 35).join(' ');

  return (
    <section id="story" className={cn(layout.section, 'bg-bg')}>
      <div className={cn(layout.narrow, layout.card, 'px-gutter py-2xl')}> 
        <div className={layout.stackMd}>
          <h2 className={text.heading}>{t('title')}</h2>
          <p className={text.body}>{expanded ? fullBody : `${preview}…`}</p>
          <button
            type="button"
            className={cn(buttons.secondary, 'w-fit')}
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            {expanded ? t('less') : t('more')}
          </button>
        </div>
      </div>
    </section>
  );
}
