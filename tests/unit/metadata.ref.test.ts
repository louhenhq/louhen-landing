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
    expect(metadata.title).toBeUndefined();
  });
});
