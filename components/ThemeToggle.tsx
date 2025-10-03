'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import { cn } from '@/app/(site)/_lib/ui';
import { getSavedTheme, setTheme } from '@/app/theme-client';
import type { ThemePreference } from '@/lib/theme/constants';

const OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];

export default function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations('theme');
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    setPreference(getSavedTheme());
  }, []);

  const handleSelect = (value: ThemePreference) => {
    setPreference(value);
    setTheme(value);
    const messageKey = `announce.${value}` as const;
    const message = t.has(messageKey) ? t(messageKey) : '';
    setAnnouncement(message);
  };

  return (
    <div className={cn('flex items-center gap-xs', className)}>
      <div role="radiogroup" aria-label={t('label')} className="flex items-center gap-xs">
        {OPTIONS.map((option) => {
          const isActive = preference === option;
          return (
            <Button
              key={option}
              type="button"
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              role="radio"
              aria-checked={isActive}
              aria-label={t(option)}
              onClick={() => handleSelect(option)}
              className={cn(
                'min-w-[3.5rem] px-sm py-xs text-body-sm font-medium capitalize',
                !isActive && 'text-text-muted'
              )}
            >
              {t(option)}
            </Button>
          );
        })}
      </div>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
