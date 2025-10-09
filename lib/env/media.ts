const DISABLE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const ENABLE_VALUES = new Set(['0', 'false', 'no', 'off']);

let dynamicOgOverride: boolean | null = null;

function normalizeFlag(value: string | undefined | null): string | null {
  if (!value) return null;
  return value.trim().toLowerCase();
}

export function isDynamicOgEnabled(): boolean {
  if (dynamicOgOverride !== null) {
    return dynamicOgOverride;
  }
  const raw = normalizeFlag(process.env.OG_DYNAMIC_DISABLED) ?? normalizeFlag(process.env.NEXT_PUBLIC_OG_DYNAMIC_DISABLED);
  if (!raw) return true;
  if (DISABLE_VALUES.has(raw)) return false;
  if (ENABLE_VALUES.has(raw)) return true;
  return true;
}

export function setDynamicOgOverride(override: boolean | null): void {
  dynamicOgOverride = override;
}
