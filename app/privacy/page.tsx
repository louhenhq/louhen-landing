import type { Metadata } from 'next';

import { SITE_NAME, LEGAL_ENTITY } from '@/constants/site';

export const metadata: Metadata = {
  title: `Privacy Policy — ${SITE_NAME}`,
  description: `Privacy commitments for ${SITE_NAME}.`,
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-slate-700">
        Our full privacy policy is on the way. Until then, {SITE_NAME} follows EU data protection guidelines and keeps your
        waitlist information secure.
      </p>
      <section className="mt-8 space-y-3 text-slate-700">
        <p><b>Controller:</b> {LEGAL_ENTITY}, Berlin, Germany</p>
        <p>
          <b>Contact:</b> <a className="underline" href="mailto:privacy@louhen.com">privacy@louhen.com</a>
        </p>
      </section>
    </main>
  );
}
