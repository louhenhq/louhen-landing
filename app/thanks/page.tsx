import Link from 'next/link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function ThanksPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const code = typeof searchParams.code === 'string' ? searchParams.code : Array.isArray(searchParams.code) ? searchParams.code[0] : '';
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  const url = new URL(base || 'http://localhost');
  url.pathname = '/';
  if (code) url.searchParams.set('ref', code);
  const link = url.toString();

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">You’re on the list 🎉</h1>
      <p className="mt-2">Share your referral link to climb the list:</p>
      <p className="mt-2 font-mono break-all border rounded-lg p-3 bg-white">{link}</p>
      <div className="mt-4 flex gap-2">
        <a className="underline" href={`https://wa.me/?text=${encodeURIComponent(link)}`} target="_blank">WhatsApp</a>
        <a className="underline" href={`sms:&body=${encodeURIComponent(link)}`}>SMS</a>
        <button
          className="underline"
          onClick={async () => {
            try { await navigator.clipboard.writeText(link); alert('Copied'); } catch {}
          }}
        >Copy</button>
      </div>
      <p className="mt-6"><Link className="underline" href="/">Back to home</Link></p>
    </main>
  );
}

