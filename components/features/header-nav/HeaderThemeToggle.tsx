'use client';

import { useEffect, useId, useMemo, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { getSavedTheme, setTheme } from '@app/theme-client';
import { recordHeaderEvent, type HeaderEventContext } from '@lib/analytics/header';
import type { HeaderSurface, HeaderThemePreference } from '@lib/analytics.schema';
import { cn, focusRing } from '@app/(site)/_lib/ui';

type ThemePref = HeaderThemePreference;

type HeaderThemeToggleProps = {
  variant: 'desktop' | 'mobile';
  analyticsContext: HeaderEventContext;
  surface?: HeaderSurface;
  onThemeChange?: () => void;
};

export default function HeaderThemeToggle({ variant, analyticsContext, surface, onThemeChange }: HeaderThemeToggleProps) {
  const t = useTranslations('header');
  const selectId = useId();
  const [theme, setThemeState] = useState<ThemePref>('system');
  const surfaceValue: HeaderSurface = surface ?? (variant === 'desktop' ? 'header' : 'drawer');

  useEffect(() => {
    setThemeState(getSavedTheme());
  }, []);

  const options = useMemo(
    () => [
      { value: 'system', label: t('theme.modes.system') },
      { value: 'light', label: t('theme.modes.light') },
      { value: 'dark', label: t('theme.modes.dark') },
    ],
    [t]
  );

  const containerClass = variant === 'desktop'
    ? 'inline-flex items-center gap-xs'
    : 'flex w-full flex-col gap-sm';

  const labelClass = variant === 'desktop'
    ? 'sr-only'
    : 'text-sm font-medium text-text';

  const selectClass = variant === 'desktop'
    ? cn(
        'min-w-[8rem] rounded-pill border border-border bg-bg px-sm py-xs text-sm text-text disabled:opacity-70',
        focusRing
      )
    : cn(
        'w-full rounded-pill border border-border bg-bg px-sm py-xs text-sm text-text disabled:opacity-70',
        focusRing
      );

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as ThemePref;
    setThemeState(next);
    setTheme(next);
    recordHeaderEvent(
      'header_theme_toggle',
      analyticsContext,
      {
        from: theme,
        to: next,
        trigger: 'change',
      },
      { surface: surfaceValue }
    );
    onThemeChange?.();
  };

  return (
    <div className={containerClass} data-theme-switcher>
      <label htmlFor={selectId} className={labelClass}>
        {t('theme.label')}
      </label>
      <select
        id={selectId}
        className={selectClass}
        value={theme}
        onChange={handleChange}
        data-testid={variant === 'desktop' ? 'header-theme-select-desktop' : 'header-theme-select-mobile'}
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
