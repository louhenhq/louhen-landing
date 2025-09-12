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

