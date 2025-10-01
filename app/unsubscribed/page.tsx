export const metadata = { title: 'Unsubscribed — Louhen' };

export default function UnsubscribedPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-display-lg text-text">You’re unsubscribed</h1>
      <p className="mt-3 text-body text-text-muted">
        You won’t receive further emails from us. If this was a mistake, contact <a className="underline" href="mailto:hello@louhen.com">hello@louhen.com</a>.
      </p>
    </main>
  );
}
