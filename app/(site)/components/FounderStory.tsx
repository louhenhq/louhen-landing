'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { Button, Card } from '@/components/ui';

export default function FounderStory() {
  const t = useTranslations('founder');
  const [expanded, setExpanded] = useState(false);
  const fullBody = t('body');
  const preview = fullBody.split(' ').slice(0, 35).join(' ');

  return (
    <section id="founder-story" className={cn(layout.section, 'bg-bg')}>
      <Card className={cn(layout.narrow, 'px-gutter py-2xl')}>
        <div className={layout.stackMd}>
          <h2 className={text.heading}>{t('title')}</h2>
          <p className={text.body}>{expanded ? fullBody : `${preview}…`}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="w-fit"
          >
            {expanded ? t('less') : t('more')}
          </Button>
        </div>
      </Card>
    </section>
  );
}
