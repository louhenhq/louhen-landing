import type { AbstractIntlMessages } from 'next-intl';

const missingKeyLog = new Set<string>();

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type SafeGetOptions = {
  locale?: string;
  fallbackHint?: string;
};

export function safeGetMessage<T = string>(
  messages: AbstractIntlMessages | Record<string, unknown>,
  path: string,
  options: SafeGetOptions = {}
): T {
  const segments = path.split('.').filter(Boolean);
  let current: unknown = messages;

  for (const segment of segments) {
    if (!isObject(current) || !(segment in current)) {
      current = undefined;
      break;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  if (current === undefined || current === null) {
    if (process.env.NODE_ENV !== 'production' && !missingKeyLog.has(path)) {
      const { locale, fallbackHint } = options;
      const localeSuffix = locale ? ` for locale "${locale}"` : '';
      const hintSuffix = fallbackHint ? ` (${fallbackHint})` : '';
      console.warn(`[intl] Missing message "${path}"${localeSuffix} - falling back to empty string${hintSuffix}.`);
      missingKeyLog.add(path);
    }
    return '' as unknown as T;
  }

  return current as T;
}
