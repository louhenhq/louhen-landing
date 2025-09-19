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
  locale: string;
  status: 'pending' | 'confirmed' | 'expired';
  confirmToken: string | null;
  confirmExpiresAt: FirebaseFirestore.Timestamp | null;
  confirmSentAt?: FirebaseFirestore.Timestamp | null;
  confirmedAt?: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  gdprConsent: boolean;
  gdprConsentAt?: FirebaseFirestore.Timestamp | null;
  lastSignupIpHash?: string | null;
};
