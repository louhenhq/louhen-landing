'use client';

import React, { useCallback, useMemo, useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useConsent } from '@/components/ConsentProvider';
import { track } from '@/lib/clientAnalytics';
import {
  LOCALE_COOKIE,
  buildLocalePath,
  localeDefinitions,
  matchLocaleFromPath,
  normalizeLocale,
  type SupportedLocale,
} from '@/next-intl.locales';

type LocaleSwitcherProps = {
  id?: string;
  className?: string;
};

const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // six months

function persistLocaleCookie(locale: SupportedLocale) {
  try {
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure ? '; Secure' : ''}`;
  } catch {
    // Ignore failures (e.g., disabled cookies).
  }
}

function persistLocaleLocalStorage(locale: SupportedLocale) {
  try {
    window.localStorage.setItem(LOCALE_COOKIE, locale);
  } catch {
    // Ignore quota/security errors.
  }
}

async function verifyPathExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: 'HEAD', cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

export default function LocaleSwitcher({ id, className }: LocaleSwitcherProps) {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { consent } = useConsent();
  const normalizedLocale = normalizeLocale(locale) ?? localeDefinitions[0]?.locale;

  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<SupportedLocale | null>(normalizedLocale ?? null);

  const options = useMemo(
    () =>
      localeDefinitions.map((definition) => ({
        value: definition.locale,
        label: definition.label,
      })),
    []
  );

  const buildTargetDestination = useCallback(
    async (targetLocale: SupportedLocale): Promise<{ path: string; preserved: boolean }> => {
      const current = pathname || '/';
      const match = matchLocaleFromPath(current);
      const remainder = match ? match.remainder : current;
      const candidate = buildLocalePath(targetLocale, remainder);

      if (!remainder || remainder === '/' || remainder === '') {
        return { path: candidate, preserved: true };
      }

      const exists = await verifyPathExists(candidate);
      if (exists) return { path: candidate, preserved: true };
      return { path: buildLocalePath(targetLocale, '/'), preserved: false };
    },
    [pathname]
  );

  const handleChange = useCallback(
    (nextLocaleRaw: string) => {
      const normalized = normalizeLocale(nextLocaleRaw) ?? null;
      if (!normalized || normalized === selected) return;
      setSelected(normalized);

      startTransition(async () => {
        const destination = await buildTargetDestination(normalized);
        const query = searchParams?.toString();
        const href = query ? `${destination.path}?${query}` : destination.path;

        persistLocaleCookie(normalized);
        if (consent?.marketing) {
          persistLocaleLocalStorage(normalized);
        }

        void track('locale_changed', {
          from: selected ?? normalizedLocale ?? '',
          to: normalized,
          preservedPath: destination.preserved,
        });

        router.push(href);
      });
    },
    [buildTargetDestination, consent?.marketing, router, searchParams, selected, normalizedLocale]
  );

  return (
    <select
      id={id}
      className={className}
      value={selected ?? ''}
      onChange={(event) => handleChange(event.target.value)}
      disabled={pending}
      aria-label="Select language and region"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
