'use client';
import * as React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Step = 'account' | 'profile' | 'sizing' | 'browse';
const STEPS: Step[] = ['account','profile','sizing','browse'];

type OnboardState = {
  stepIndex: number;
  account: { email?: string; created?: boolean };
  profile: { childName?: string; dob?: string; currentSize?: string };
  sizing: { method?: 'scan' | 'manual' | 'current'; footLengthMm?: number };
  xp: number;
  set<K extends keyof OnboardState>(key: K, value: OnboardState[K]): void;
  goto: (s: Step) => void;
  next: () => void;
  prev: () => void;
};

export const useOnboard = create<OnboardState>()(
  persist(
    (
      set: (partial: Partial<OnboardState>) => void,
      get: () => OnboardState
    ): OnboardState => ({
      stepIndex: 0,
      account: {},
      profile: {},
      sizing: {},
      xp: 0,
      set(key, value) { set({ [key]: value } as Partial<OnboardState>); },
      goto(s) { set({ stepIndex: Math.max(0, STEPS.indexOf(s)) }); },
      next() { set({ stepIndex: Math.min(get().stepIndex + 1, STEPS.length - 1) }); },
      prev() { set({ stepIndex: Math.max(get().stepIndex - 1, 0) }); },
    }),
    { name: 'louhen-onboarding' }
  )
);

// ---------- Validation helpers ----------
function isEmail(s: string) {
  // Simple RFC5322-ish check good enough for UI
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
}
function parseDateISO(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
function childAgeYears(d: Date) {
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function Progress() {
  const { stepIndex } = useOnboard();
  return (
    <div className="flex items-center gap-2" aria-label="Progress">
      {STEPS.map((_, i) => (
        <div key={i} className={`h-1.5 w-16 rounded ${i <= stepIndex ? 'bg-slate-900' : 'bg-slate-200'}`} />
      ))}
      <span className="ml-2 text-xs text-slate-600">{stepIndex+1}/{STEPS.length}</span>
    </div>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600">{children}</span>;
}
function Info({ text }: { text: string }) {
  return <span className="ml-1 text-slate-500" title={text} aria-label={text}>ℹ️</span>;
}
function TrustBadges() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Badge>🦶 Podiatrist approved</Badge>
      <Badge>✅ LouhenFit Guarantee</Badge>
      <Badge>🔒 GDPR-first data safety</Badge>
    </div>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const { stepIndex, prev } = useOnboard();
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <div className="font-semibold">Louhen</div>
          <Progress />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {children}
        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (stepIndex === 0 ? router.push('/') : prev())}
            className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50"
          >
            Back
          </button>
        </div>
        <TrustBadges />
      </main>
    </div>
  );
}

function StepAccount() {
  const { set, next, account } = useOnboard();
  const [email, setEmail] = React.useState(account.email || '');
  const [err, setErr] = React.useState<string>('');
  const emailRef = React.useRef<HTMLInputElement>(null);
  const [srMsg, setSrMsg] = React.useState<string>('');
  return (
    <Shell title="Create your account">
      <p className="mt-2 text-slate-600">We’ll use your email to save progress<Info text="Used only for onboarding and account setup." />.</p>
      <form
        className="mt-6 grid gap-4 max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          const value = email.trim();
          if (!isEmail(value)) {
            const msg = 'Please enter a valid email (e.g. name@example.com).';
            setErr(msg);
            setSrMsg(msg);
            emailRef.current?.focus();
            return;
          }
          setErr('');
          setSrMsg('');
          set('account', { email: value, created: true });
          next();
        }}
      >
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            aria-invalid={err ? 'true' : 'false'}
            aria-describedby={err ? 'acc-email-err' : 'acc-email-hint'}
            ref={emailRef}
            className={`mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 ${
              err ? 'border-rose-400' : 'border-slate-300'
            }`}
          />
          <p id="acc-email-hint" className="mt-1 text-xs text-slate-500">We’ll never share your email.</p>
          {err && <p id="acc-email-err" className="mt-1 text-sm text-rose-600">{err}</p>}
          {/* Screen-reader live region */}
          <p className="sr-only" role="alert" aria-live="assertive">{srMsg}</p>
        </label>
        <div className="flex gap-3">
          <button className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold hover:opacity-90">Continue</button>
          <button type="button" onClick={next}
            className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50">Skip for now</button>
        </div>
      </form>
    </Shell>
  );
}

function StepProfile() {
  const { profile, set, next } = useOnboard();
  const [childName, setChildName] = React.useState(profile.childName || '');
  const [dob, setDob] = React.useState(profile.dob || '');
  const [size, setSize] = React.useState(profile.currentSize || '');
  const [message, setMessage] = React.useState('');
  const [errs, setErrs] = React.useState<{ dob?: string; size?: string }>({});
  const dobRef = React.useRef<HTMLInputElement>(null);
  const sizeRef = React.useRef<HTMLInputElement>(null);
  const [srMsg, setSrMsg] = React.useState<string>('');
  return (
    <Shell title="Tell us about your child">
      <form
        className="mt-6 grid gap-4 max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          const newErrs: { dob?: string; size?: string } = {};
          // DOB validation (optional)
          if (dob) {
            const d = parseDateISO(dob);
            if (!d) newErrs.dob = 'Please enter a valid date.';
            else if (d > new Date()) newErrs.dob = 'Date cannot be in the future.';
            else {
              const age = childAgeYears(d);
              if (age < 0 || age > 12) newErrs.dob = 'Child age should be between 0–12 years.';
            }
          }
          // Size validation (optional but reasonable bounds)
          if (size && (size.length < 2 || size.length > 10)) {
            newErrs.size = 'Size looks off — try a format like “EU 25”.';
          }
          setErrs(newErrs);
          if (Object.keys(newErrs).length) {
            if (newErrs.dob) dobRef.current?.focus();
            else if (newErrs.size) sizeRef.current?.focus();
            setSrMsg(Object.values(newErrs).filter(Boolean).join(' '));
            return;
          }
          setSrMsg('');
          set('profile', { childName: childName.trim(), dob, currentSize: size.trim() });
          set('xp', 10);
          setMessage('✅ +10 XP — First profile created');
          setTimeout(()=>setMessage(''), 1500);
          next();
        }}
      >
        <label className="block">
          <span className="text-sm font-medium">Child name</span>
          <input value={childName} onChange={(e)=>setChildName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Date of birth</span>
          <input
            type="date"
            value={dob}
            onChange={(e)=>setDob(e.target.value)}
            aria-invalid={errs.dob ? 'true' : 'false'}
            aria-describedby={errs.dob ? 'prof-dob-err' : 'prof-dob-hint'}
            ref={dobRef}
            className={`mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 ${
              errs.dob ? 'border-rose-400' : 'border-slate-300'
            }`}
          />
          <p id="prof-dob-hint" className="mt-1 text-xs text-slate-500">Optional. Helps tailor size guidance.</p>
          {errs.dob && <p id="prof-dob-err" className="mt-1 text-sm text-rose-600">{errs.dob}</p>}
        </label>
        <label className="block">
          <span className="text-sm font-medium">Current shoe size <span className="text-slate-500">(optional)</span></span>
          <input
            value={size}
            onChange={(e)=>setSize(e.target.value)}
            aria-invalid={errs.size ? 'true' : 'false'}
            aria-describedby={errs.size ? 'prof-size-err' : 'prof-size-hint'}
            ref={sizeRef}
            className={`mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 ${
              errs.size ? 'border-rose-400' : 'border-slate-300'
            }`}
            placeholder="e.g. EU 25"
          />
          <p id="prof-size-hint" className="mt-1 text-xs text-slate-500">Optional. Example format: “EU 25”.</p>
          {errs.size && <p id="prof-size-err" className="mt-1 text-sm text-rose-600">{errs.size}</p>}
          {/* Screen-reader live region */}
          <p className="sr-only" role="alert" aria-live="assertive">{srMsg}</p>
        </label>
        <div className="flex gap-3">
          <button className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold hover:opacity-90">Continue</button>
          <button type="button" onClick={next}
            className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50">Skip for now</button>
        </div>
        {message && <p className="text-sm text-emerald-700" aria-live="polite">{message}</p>}
      </form>
    </Shell>
  );
}

function StepSizing() {
  const { sizing, set, next } = useOnboard();
  const [method, setMethod] = React.useState<'scan'|'manual'|'current'>(sizing.method || 'manual');
  const [mm, setMm] = React.useState<number>(sizing.footLengthMm || 150);
  const [err, setErr] = React.useState<string>('');
  const mmRef = React.useRef<HTMLInputElement>(null);
  const [srMsg, setSrMsg] = React.useState<string>('');
  return (
    <Shell title="Choose a sizing method">
      <div className="mt-6 grid gap-4 max-w-md">
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Method</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="m" checked={method==='scan'} onChange={()=>setMethod('scan')} />
            <span>Scan with phone <span className="text-slate-500">(coming soon)</span></span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="m" checked={method==='manual'} onChange={()=>setMethod('manual')} />
            <span>Manual measurement (length in mm) <Info text="We use foot length + age for an initial match." /></span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="m" checked={method==='current'} onChange={()=>setMethod('current')} />
            <span>Use current shoe size</span>
          </label>
        </fieldset>

        {method==='manual' && (
          <label className="block">
            <span className="text-sm font-medium">Foot length (mm)</span>
            <input
              type="number"
              min={80}
              max={250}
              value={mm}
              onChange={(e)=>setMm(clamp(Number(e.target.value || '0'), 0, 9999))}
              aria-invalid={err ? 'true' : 'false'}
              aria-describedby={err ? 'sz-mm-err' : 'sz-mm-hint'}
              ref={mmRef}
              className={`mt-1 w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                err ? 'border-rose-400' : 'border-slate-300'
              }`}
            />
            <p id="sz-mm-hint" className="mt-1 text-xs text-slate-500">Typical range: 110–200 mm for ages 1–6.</p>
            {err && <p id="sz-mm-err" className="mt-1 text-sm text-rose-600">{err}</p>}
            {/* Screen-reader live region */}
            <p className="sr-only" role="alert" aria-live="assertive">{srMsg}</p>
          </label>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              // Validate
              if (!method) { const m='Choose a sizing method.'; setErr(m); setSrMsg(m); return; }
              if (method === 'manual') {
                if (Number.isNaN(mm) || mm < 80 || mm > 250) { const m='Foot length must be between 80–250 mm.'; setErr(m); setSrMsg(m); mmRef.current?.focus(); return; }
              }
              setErr('');
              setSrMsg('');
              set('sizing', { method, footLengthMm: method==='manual' ? mm : undefined });
              next();
            }}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold hover:opacity-90"
          >
            Continue
          </button>
          <button
            onClick={() => next()}
            className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50"
          >
            Skip for now
          </button>
        </div>

        <div className="text-sm text-slate-600 mt-2">
          <strong>Why this matters:</strong> Good fit supports healthy growth and comfort.
        </div>
      </div>
    </Shell>
  );
}

function StepBrowse() {
  const { account, profile, sizing } = useOnboard();
  return (
    <Shell title="All set — let’s browse!">
      <div className="mt-6 grid gap-2 text-slate-700">
        <div>Account: <span className="font-mono">{account.email || '—'}</span></div>
        <div>Child: <span className="font-mono">{profile.childName || '—'}</span></div>
        <div>Sizing: <span className="font-mono">{sizing.method || '—'}</span></div>
      </div>
      <div className="mt-6">
        <Link href="/" className="rounded-xl bg-slate-900 text-white px-4 py-2 font-semibold hover:opacity-90">Start browsing</Link>
      </div>
    </Shell>
  );
}

export default function OnboardingStepPage() {
  const params = useParams<{ step: string }>();
  const router = useRouter();
  const { stepIndex, goto } = useOnboard();

  React.useEffect(() => {
    const step = (params?.step || 'account') as Step;
    if (!STEPS.includes(step)) { router.replace('/onboarding/account'); return; }
    goto(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.step]);

  const step = STEPS[stepIndex] as Step;
  if (step === 'account') return <StepAccount />;
  if (step === 'profile') return <StepProfile />;
  if (step === 'sizing') return <StepSizing />;
  return <StepBrowse />;
}
