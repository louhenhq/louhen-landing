type UtmParams = Partial<{
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}>;

export function appendUtmParams(url: string, utm?: UtmParams | null): string {
  if (!utm || Object.keys(utm).length === 0) {
    return url;
  }

  try {
    const instance = new URL(url, 'https://placeholder.invalid');
    Object.entries(utm).forEach(([key, value]) => {
      if (!value) return;
      instance.searchParams.set(`utm_${key}`, value);
    });
    if (/^https?:\/\//.test(url)) {
      return instance.toString();
    }
    return `${instance.pathname}${instance.search}${instance.hash}`;
  } catch {
    return url;
  }
}

export type { UtmParams };
