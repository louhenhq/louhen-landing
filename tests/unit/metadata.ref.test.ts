import { describe, expect, it } from 'vitest';
import { generateMetadata } from '@/app/(site)/[locale]/page';

describe('landing metadata', () => {
  it('returns invite metadata when ref present', async () => {
    const metadata = await generateMetadata({ params: { locale: 'en' }, searchParams: { ref: 'CODE123' } });
    const resolvedTitle =
      typeof metadata.title === 'string'
        ? metadata.title
        : (metadata.title?.absolute ?? metadata.title?.default ?? '');
    expect(resolvedTitle).toContain('invited');
    expect(metadata.openGraph?.url).toContain('ref=CODE123');
  });

  it('returns default metadata when ref missing', async () => {
    const metadata = await generateMetadata({ params: { locale: 'en' }, searchParams: {} });
    const resolvedTitle =
      typeof metadata.title === 'string'
        ? metadata.title
        : (metadata.title?.absolute ?? metadata.title?.default ?? '');
    expect(resolvedTitle).toMatch(/Louhen/i);
    if (typeof metadata.openGraph?.url === 'string') {
      expect(metadata.openGraph.url.includes('ref=')).toBe(false);
    }
  });
});
