import { LEGAL_ENTITY, SITE_NAME } from '@/constants/site';
export const metadata = { title: `Imprint — ${SITE_NAME}` };

export default function ImprintPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-display-lg text-text">Imprint (Impressum)</h1>
      <div className="mt-4 space-y-2 text-body text-text">
        <p><b>{LEGAL_ENTITY}</b></p>
        <p>Berlin, Germany</p>
        <p><b>Email:</b> <a className="underline" href="mailto:hello@louhen.com">hello@louhen.com</a></p>
        <p><b>Authorized Representative:</b> Martin Weis (Founder)</p>
      </div>
    </main>
  );
}
