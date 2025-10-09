export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { FieldValue } from 'firebase-admin/firestore';
import { createTranslator, type AbstractIntlMessages } from 'next-intl';
import { initAdmin } from '@/lib/firebaseAdmin';
import { sha256Hex } from '@/lib/crypto/token';
import { ConfirmResendForm, ConfirmAnalytics } from '@components/features/waitlist';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { loadMessages } from '@/lib/intl/loadMessages';
import { isPrelaunch } from '@/lib/env/prelaunch';
import { getSiteOrigin, hreflangMapFor, makeCanonical } from '@/lib/seo/shared';
import { buildOgImageEntry } from '@lib/shared/og/builder';
import { waitlistConfirmPath } from '@lib/shared/routing/waitlist-path';
import type { SupportedLocale } from '@/next-intl.locales';
import { unstable_setRequestLocale } from 'next-intl/server';
import SharePanel from '@/app/(site)/components/SharePanel';

type ConfirmPageProps = {
  params: { locale: SupportedLocale };
  searchParams?: { token?: string };
};

type ConfirmState = 'confirmed' | 'expired' | 'already' | 'invalid';
type WaitlistDocSnapshot = {
  confirmTokenHash?: string | null;
  confirmedAt?: unknown;
  confirmExpiresAt?: { toMillis: () => number } | null;
  refCode?: string | null;
};

type ConfirmMessages = {
  success: { title: string; body: string };
  expired: { title: string; body: string };
  already: { title: string; body: string };
  invalid: { title: string; body: string };
  resend: { cta: string; sent: string; error: string };
};

type ShareCopy = {
  title: string;
  subtitle: string;
  linkLabel: string;
  codeLabel: string;
  copyLink: string;
  copyCode: string;
  copied: string;
  nativeShare: string;
  codePending: string;
  qr: string;
  verificationPending: string;
  assurance: string;
};

function getConfirmMessages(localeMessages: Record<string, unknown>): ConfirmMessages {
  const fallback: ConfirmMessages = {
    success: { title: 'Confirmed', body: 'Your spot is secured.' },
    expired: { title: 'Confirmation link expired', body: 'Request a new confirmation email below.' },
    already: { title: 'Already confirmed', body: 'This email is already on the waitlist.' },
    invalid: { title: 'Invalid link', body: 'Check the URL or request a new confirmation email below.' },
    resend: { cta: 'Resend confirmation', sent: 'If that email exists, a new link is on its way.', error: 'We could not send the email. Please try again later.' },
  };

  const confirm = (localeMessages.confirm ?? {}) as Partial<ConfirmMessages>;
  const resend = (confirm.resend ?? {}) as Partial<ConfirmMessages['resend']>;

  return {
    success: { ...fallback.success, ...confirm.success },
    expired: { ...fallback.expired, ...confirm.expired },
    already: { ...fallback.already, ...confirm.already },
    invalid: { ...fallback.invalid, ...confirm.invalid },
    resend: { ...fallback.resend, ...resend },
  };
}

function getShareCopy(localeMessages: Record<string, unknown>, locale: SupportedLocale): ShareCopy {
  const trustCopy = createTranslator({
    locale,
    messages: localeMessages as AbstractIntlMessages,
    namespace: 'trustCopy',
  });
  const fallback: ShareCopy = {
    title: 'Share & earn',
    subtitle: 'Invite friends with your link and you’ll both receive rewards when they place their first order.',
    linkLabel: 'Referral link',
    codeLabel: 'Referral code',
    copyLink: 'Copy link',
    copyCode: 'Copy code',
    copied: 'Copied!',
    nativeShare: 'Share',
    codePending: 'Your referral code will appear here soon.',
    qr: 'Show QR code',
    verificationPending: 'Referral will be verified shortly.',
    assurance: trustCopy('coverage.covered'),
  };
  const share = (localeMessages.share ?? {}) as Partial<ShareCopy>;
  return { ...fallback, ...share };
}

export async function generateMetadata({ params }: ConfirmPageProps): Promise<Metadata> {
  const { locale } = params;
  const baseUrl = getSiteOrigin();
  const canonicalPath = waitlistConfirmPath(locale);
  const canonicalUrl = makeCanonical(canonicalPath, baseUrl);
  const hreflang = hreflangMapFor(waitlistConfirmPath, baseUrl);
  const robots = isPrelaunch()
    ? { index: false, follow: false }
    : undefined;

  let title = 'Confirm your Louhen waitlist spot';
  let description = 'Verify your email to secure access to the Louhen waitlist.';

  try {
    const localeMessages = await loadMessages(locale);
    const confirmMessages = getConfirmMessages(localeMessages as Record<string, unknown>);
    title = confirmMessages.success.title;
    description = confirmMessages.success.body;
  } catch {
    // fall back to defaults
  }

  const ogImage = buildOgImageEntry({
    locale,
    surface: 'confirm',
    title,
    description,
  });

  return {
    title,
    description,
    robots,
    alternates: {
      canonical: canonicalUrl,
      languages: hreflang,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      locale,
      type: 'website',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.url],
    },
  };
}

export default async function ConfirmPage({ params, searchParams }: ConfirmPageProps) {
  const { locale } = params;
  unstable_setRequestLocale(locale);
  const token = typeof searchParams?.token === 'string' ? searchParams.token.trim() : '';
  const localeMessages = await loadMessages(locale);
  const baseMessages = localeMessages as Record<string, unknown>;
  const confirmMessages = getConfirmMessages(baseMessages);
  const shareCopy = getShareCopy(baseMessages, locale);

  if (!token || token.length < 20) {
    return renderInfo('invalid', confirmMessages);
  }

  const hash = sha256Hex(token);
  const app = initAdmin();
  const db = app.firestore();
  const snap = await db.collection('waitlist').where('confirmTokenHash', '==', hash).limit(1).get();

  if (snap.empty) {
    return renderInfo('invalid', confirmMessages);
  }

  const doc = snap.docs[0];
  const data = doc.data() as WaitlistDocSnapshot;
  const refCode = typeof doc.get('refCode') === 'string' ? String(doc.get('refCode')).toUpperCase() : typeof data.refCode === 'string' ? String(data.refCode).toUpperCase() : null;
  const creditDelayed = Boolean(doc.get('creditDelayed'));

  if (data.confirmedAt) {
    return renderShare({ state: 'already', confirmMessages, shareCopy, locale, code: refCode, creditDelayed });
  }

  const expires = typeof data.confirmExpiresAt?.toMillis === 'function' ? data.confirmExpiresAt.toMillis() : undefined;
  if (expires && Date.now() > expires) {
    return renderInfo('expired', confirmMessages);
  }

  await doc.ref.set(
    {
      status: 'confirmed',
      confirmedAt: FieldValue.serverTimestamp(),
      confirmTokenHash: null,
      confirmExpiresAt: null,
    },
    { merge: true }
  );

  return renderShare({ state: 'confirmed', confirmMessages, shareCopy, locale, code: refCode, creditDelayed });
}

function renderInfo(state: ConfirmState, messages: ConfirmMessages) {
  const titles: Record<ConfirmState, string> = {
    confirmed: messages.success.title,
    expired: messages.expired.title,
    already: messages.already.title,
    invalid: messages.invalid.title,
  };
  const bodies: Record<ConfirmState, string> = {
    confirmed: messages.success.body,
    expired: messages.expired.body,
    already: messages.already.body,
    invalid: messages.invalid.body,
  };

  const showResend = state === 'expired' || state === 'invalid';

  return (
    <main className={cn(layout.page, 'flex items-center justify-center bg-bg py-3xl')}>
      <ConfirmAnalytics state={state} />
      <div className={cn(layout.card, 'mx-auto max-w-2xl px-gutter py-2xl')}>
        <div className="flex flex-col gap-md">
          <div className="flex flex-col gap-xs">
            <h1 className={text.heading}>{titles[state]}</h1>
            <p className={text.body}>{bodies[state]}</p>
          </div>
          {showResend && <ConfirmResendForm />}
        </div>
      </div>
    </main>
  );
}

type ShareRenderParams = {
  state: Extract<ConfirmState, 'confirmed' | 'already'>;
  confirmMessages: ConfirmMessages;
  shareCopy: ShareCopy;
  locale: SupportedLocale;
  code: string | null;
  creditDelayed: boolean;
};

function renderShare({ state, confirmMessages, shareCopy, locale, code, creditDelayed }: ShareRenderParams) {
  const heading = state === 'confirmed' ? confirmMessages.success.title : confirmMessages.already.title;
  const body = state === 'confirmed' ? confirmMessages.success.body : confirmMessages.already.body;

  return (
    <main className={cn(layout.page, 'flex items-center justify-center bg-bg py-3xl')}>
      <ConfirmAnalytics state={state} />
      <div className={cn(layout.card, 'mx-auto max-w-3xl px-gutter py-2xl')}>
        <div className="flex flex-col gap-lg">
          <div className="flex flex-col gap-xs text-center">
            <h1 className={text.heading}>{heading}</h1>
            <p className={text.body}>{body}</p>
          </div>
          {creditDelayed && (
            <p className="text-body-sm text-status-warning text-center" aria-live="polite">
              {shareCopy.verificationPending}
            </p>
          )}
          <SharePanel locale={locale} code={code} copy={shareCopy} />
        </div>
      </div>
    </main>
  );
}
