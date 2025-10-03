import type { Metadata } from 'next';

import { SITE_NAME } from '@/constants/site';

export const metadata: Metadata = {
  title: `Terms — ${SITE_NAME}`,
  description: `Pre-launch terms of service details for ${SITE_NAME}.`,
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-display-lg text-text">Terms</h1>
      <p className="mt-4 text-body text-text">
        These placeholder terms cover the waitlist period while we finalize the full agreement for {SITE_NAME}. Official
        subscription terms will be shared when early access opens.
      </p>
    </main>
  );
}
