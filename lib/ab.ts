const STORAGE_KEY = 'ab:heroCta';

export type Variant = 'A' | 'B';

export function getHeroVariant(): Variant {
  if (typeof window === 'undefined') return 'A';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'A' || saved === 'B') return saved as Variant;
  const v: Variant = Math.random() < 0.5 ? 'A' : 'B';
  window.localStorage.setItem(STORAGE_KEY, v);
  return v;
}

