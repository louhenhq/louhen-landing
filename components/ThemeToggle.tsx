'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { setTheme, setContrast, getSavedTheme, getSavedContrast } from '@/app/theme-client';

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<'system'|'light'|'dark'>(() => getSavedTheme());
  const [contrast, setContrastState] = useState<'system'|'normal'|'more'>(() => getSavedContrast());

  useEffect(() => {
    // ensure current states are applied on mount
    setTheme(theme);
    setContrast(contrast);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-2 text-body text-text">
      <label className="sr-only">Theme</label>
      <select
        className="rounded-2xl border border-border bg-bg px-sm py-xs text-label text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        value={theme}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          const v = e.target.value as 'system'|'light'|'dark';
          setThemeState(v);
          setTheme(v);
        }}
        aria-label="Theme"
      >
        <option value="system">Theme: System</option>
        <option value="light">Theme: Light</option>
        <option value="dark">Theme: Dark</option>
      </select>

      <label className="sr-only">Contrast</label>
      <select
        className="rounded-2xl border border-border bg-bg px-sm py-xs text-label text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        value={contrast}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          const v = e.target.value as 'system'|'normal'|'more';
          setContrastState(v);
          setContrast(v);
        }}
        aria-label="Contrast"
      >
        <option value="system">Contrast: System</option>
        <option value="normal">Contrast: Normal</option>
        <option value="more">Contrast: High</option>
      </select>

      <button
        className="rounded-2xl border border-border px-sm py-xs text-label text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        onClick={() => {
          setThemeState('system');
          setContrastState('system');
          setTheme('system');
          setContrast('system');
        }}
        aria-label="Reset to system preferences"
        title="Reset to system"
      >
        Reset
      </button>
    </div>
  );
}
