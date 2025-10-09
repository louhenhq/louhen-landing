import { NextResponse } from 'next/server';
import { buildLocaleHref, resolveTargetLocale } from '@/lib/intl/localePath';
import { locales, type SupportedLocale } from '@/next-intl.locales';

function sanitizePath(value: string | null | undefined): string {
  if (!value) return '/';
  try {
    const url = new URL(value, 'https://placeholder.invalid');
    return url.pathname || '/';
  } catch {
    return value.startsWith('/') ? value : `/${value}`;
  }
}

function sanitizeSearch(value: string | null | undefined): string {
  if (!value) return '';
  return value.startsWith('?') ? value.slice(1) : value;
}

function isSupportedLocale(value: string): value is SupportedLocale {
  return (locales as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const rawLocale = formData.get('locale');
  const rawPath = formData.get('path');
  const rawSearch = formData.get('search');

  const targetLocale = isSupportedLocale(typeof rawLocale === 'string' ? rawLocale : '')
    ? (rawLocale as SupportedLocale)
    : resolveTargetLocale(typeof rawLocale === 'string' ? rawLocale : null);

  const path = sanitizePath(typeof rawPath === 'string' ? rawPath : '/');
  const search = sanitizeSearch(typeof rawSearch === 'string' ? rawSearch : null);

  const href = buildLocaleHref(targetLocale, path, search);
  const url = new URL(href, request.url);

  const response = NextResponse.redirect(url, { status: 303 });
  response.cookies.set({
    name: 'NEXT_LOCALE',
    value: targetLocale,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  });

  return response;
}
