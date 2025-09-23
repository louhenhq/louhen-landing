export type InlineFaqEntry = {
  q: string;
  a: string;
};

export function normalizeInlineFaqItems(raw: unknown): InlineFaqEntry[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const { q, a } = item as Record<string, unknown>;
      if (typeof q === 'string' && q.trim() && typeof a === 'string' && a.trim()) {
        return { q: q.trim(), a: a.trim() };
      }
      return null;
    })
    .filter((item): item is InlineFaqEntry => item !== null);
}

export function extractInlineFaq(
  messages: unknown,
  segment: 'onboarding' | 'pdp' | 'checkout' | 'method'
): InlineFaqEntry[] {
  if (!messages || typeof messages !== 'object') return [];
  const help = (messages as Record<string, unknown>).help;
  if (!help || typeof help !== 'object') return [];
  const inline = (help as Record<string, unknown>).inline;
  if (!inline || typeof inline !== 'object') return [];
  const raw = (inline as Record<string, unknown>)[segment];
  return normalizeInlineFaqItems(raw);
}
