'use client';

import { useEffect } from 'react';
import { observeOnce, track } from '@/lib/clientAnalytics';

const SECTION_IDS = ['founder-story', 'how'] as const;

export default function SectionViewTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cleanups: Array<() => void> = [];

    SECTION_IDS.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;
      const dispose = observeOnce(element, () => track({ name: 'section_view', id }), 0.4);
      cleanups.push(dispose);
    });

    return () => {
      cleanups.forEach((dispose) => dispose());
    };
  }, []);

  return null;
}
