export type EmailPrefs = {
  waitlistUpdates: boolean;
  referrals: boolean;
  launchNews: boolean;
};

export type WaitlistDoc = {
  email: string;
  firstName?: string | null;
  country?: string | null;
  ageBand?: string | null;
  referralCode: string;
  referralCount?: number;
  referredById?: string | null;
  referralInput?: string | null;
  createdAt?: FirebaseFirestore.Timestamp;
  consentAt?: FirebaseFirestore.Timestamp;
  ua?: string | null;
  ip?: string | null;
  unsubscribed?: boolean;
  emailPrefs?: Partial<EmailPrefs>;
  unsubscribeToken?: string | null;
  unsubscribeTokenExpiresAt?: FirebaseFirestore.Timestamp | null;
};

// NOTE: Legacy waitlist payloads are unsupported as of 2025-09-17.
// Only the unified input { email, href?, referredBy? } is valid.
// This type models the persisted document shape going forward.
// New consolidated schema for waitlist records
export type WaitlistRecord = {
  email: string;
  emailLc: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  href?: string | null;
  referrer?: { host: string; path: string } | null;
  utm?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  } | null;
  ip_hash?: string | null;
  refCode: string;
  referredBy?: string | null;
  refCount: number;
  status: 'joined' | 'confirmed';
};
