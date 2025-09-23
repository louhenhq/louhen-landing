import { describe, expect, it } from 'vitest';
import { generateMetadata } from '@/app/(site)/[locale]/page';

describe('landing metadata', () => {
  it('returns invite metadata when ref present', async () => {
    const metadata = await generateMetadata({ params: { locale: 'en' }, searchParams: { ref: 'CODE123' } });
    expect(metadata.title).toContain('invited');
    expect(metadata.openGraph?.url).toContain('ref=CODE123');
  });

  it('returns default metadata when ref missing', async () => {
    const metadata = await generateMetadata({ params: { locale: 'en' }, searchParams: {} });
    if (typeof metadata.title === 'string') {
      expect(metadata.title).toMatch(/Louhen/i);
    } else if (metadata.title !== undefined && metadata.title !== null) {
      expect(metadata.title).toMatchObject({
        default: expect.stringMatching(/Louhen/i),
      });
    }
    if (typeof metadata.openGraph?.url === 'string') {
      expect(metadata.openGraph.url.includes('ref=')).toBe(false);
    }
  });
});
