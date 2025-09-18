'use client';

export type ConsentCategories = {
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = 'consent:v1';

export function getConsent(): ConsentCategories | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentCategories;
    if (typeof parsed === 'object' && parsed) {
      return {
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentCategories) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {}
}
