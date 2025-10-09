declare global {
  interface Window {
    dataLayer?: unknown[];
    __LL_CONSENT__?: "granted" | "denied" | "unknown";
    __captureAnalytics__?: (payload: unknown) => void;
    __LOUHEN_CONSENT__?: {
      analytics?: boolean;
      marketing?: boolean;
      [key: string]: unknown;
    };
    __LOUHEN_POPUPS__?: string[];
    __LOUHEN_ANALYTICS_READY?: boolean;
  }
}

export {};
