export const WAITLIST_API_PATTERN =
  /\/api(?:\/testing)?\/waitlist(?:\/[^/?#]+)*\/?(?=$|[?#]|$)/;

export function isWaitlistApiUrl(url: string): boolean {
  const candidate = (() => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  })();

  return WAITLIST_API_PATTERN.test(candidate);
}
