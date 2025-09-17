'use client';

import * as React from 'react';
import { joinWaitlist } from '@/lib/waitlist';
import { useRouter } from 'next/navigation';

export default function WaitlistPage() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await joinWaitlist(email);
    setLoading(false);
    if (res?.ok && res.code) {
      router.push(`/thanks?code=${encodeURIComponent(res.code)}`);
    } else {
      setError(res?.error || 'Something went wrong');
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">Join the waitlist</h1>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-slate-900 text-white">
          {loading ? 'Joining…' : 'Join'}
        </button>
      </form>
      {error && <p className="mt-2 text-rose-700 text-sm">{error}</p>}
    </main>
  );
}

