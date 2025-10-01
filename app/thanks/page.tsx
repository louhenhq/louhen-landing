"use client";
import Link from 'next/link';
import * as React from 'react';
import { buttons, cn, inputs, text } from '@/app/(site)/_lib/ui';

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
      <h1 className="text-display-lg text-text">{confirmed ? 'Confirmed 🎉' : 'You’re almost done'}</h1>
      {!confirmed && (
        <p className="mt-2 text-body text-text-muted">Check your inbox to confirm your email. Once confirmed, share your referral link below.</p>
      )}
      <p className="mt-4 text-body text-text">Share your referral link:</p>
      <p className="mt-2 font-mono break-all border border-border rounded-lg p-3 bg-bg-card text-body text-text">{link}</p>
      <div className="mt-4 flex gap-2">
        <a
          className="text-label text-brand-primary underline"
          href={`https://wa.me/?text=${encodeURIComponent(link)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
        <a className="text-label text-brand-primary underline" href={`sms:&body=${encodeURIComponent(link)}`}>SMS</a>
        <button
          className="text-label text-brand-primary underline"
          onClick={async () => {
            try { await navigator.clipboard.writeText(link); alert('Copied'); } catch {}
          }}
        >Copy</button>
      </div>
      {!confirmed && <ResendForm />}
      <p className="mt-6 text-body">
        <Link className="underline text-brand-primary" href="/">Back to home</Link>
      </p>
    </main>
  );
}

function ResendForm() {
  const [email, setEmail] = React.useState('');
  const [msg, setMsg] = React.useState<string | null>(null);
  return (
    <form
      className="mt-6 flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await fetch('/api/waitlist/resend', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email, hcaptchaToken: 'dev-bypass' }),
          });
          setMsg('Email sent (if your address exists).');
        } catch {
          setMsg('Please try again later.');
        }
      }}
    >
      <input
        className={cn(inputs, 'flex-1 rounded-lg')}
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className={cn(buttons.secondary, 'rounded-lg px-sm py-xs')} type="submit">Resend confirmation</button>
      {msg && <span className="ml-2 text-body-sm text-text-muted">{msg}</span>}
    </form>
  );
}
