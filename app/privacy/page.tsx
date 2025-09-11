export const metadata = { title: 'Privacy Policy — Louhen' };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-slate-700">
        We collect only the data needed to operate the waitlist and to contact you about early access to Louhen.
        We do not sell your data. You can request deletion at any time by emailing <a className="underline" href="mailto:privacy@louhen.com">privacy@louhen.com</a>.
      </p>
      <section className="mt-8 space-y-4 text-slate-700">
        <p><b>Controller:</b> Louhen GmbH (in Gründung), Berlin, Germany</p>
        <p><b>Purpose:</b> Manage the pre-launch waitlist and send early-access emails.</p>
        <p><b>Legal basis (Art. 6 GDPR):</b> Consent (Art. 6(1)(a)).</p>
        <p><b>Data categories:</b> Email, optional first name, country, child age band, notes, technical metadata (IP, user-agent).</p>
        <p><b>Processors:</b> Google Cloud / Firebase (EU data centers where available).</p>
        <p><b>Retention:</b> Until you withdraw consent or we delete waitlist data post-launch.</p>
        <p><b>Your rights:</b> Access, rectification, deletion, restriction, data portability, and withdrawal of consent.</p>
        <p><b>Contact:</b> <a className="underline" href="mailto:privacy@louhen.com">privacy@louhen.com</a></p>
      </section>
    </main>
  );
}
