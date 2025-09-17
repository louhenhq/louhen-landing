"use client";
import Link from 'next/link';
import * as React from 'react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function ThanksPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const code = typeof searchParams.code === 'string' ? searchParams.code : Array.isArray(searchParams.code) ? searchParams.code[0] : '';
  const confirmed = String(searchParams.confirmed) === '1';
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  const url = new URL(base || 'http://localhost');
  url.pathname = '/';
  if (code) url.searchParams.set('ref', code);
  const link = url.toString();

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">{confirmed ? 'Confirmed 🎉' : 'You’re almost done'}</h1>
      {!confirmed && (
        <p className="mt-2 text-slate-600">Check your inbox to confirm your email. Once confirmed, share your referral link below.</p>
      )}
      <p className="mt-4">Share your referral link:</p>
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
      {!confirmed && <ResendForm />}
      <p className="mt-6"><Link className="underline" href="/">Back to home</Link></p>
    </main>
  );
}

function ResendForm() {
  const [email, setEmail] = React.useState('');
  const [msg, setMsg] = React.useState<string | null>(null);
  return (
    <form
      className="mt-6 flex gap-2 items-center"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await fetch('/api/waitlist/resend-confirm', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
          setMsg('Email sent (if your address exists).');
        } catch {
          setMsg('Please try again later.');
        }
      }}
    >
      <input className="flex-1 border rounded-lg px-3 py-2" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button className="px-3 py-2 rounded-lg border" type="submit">Resend confirmation</button>
      {msg && <span className="text-xs text-slate-600 ml-2">{msg}</span>}
    </form>
  );
}
