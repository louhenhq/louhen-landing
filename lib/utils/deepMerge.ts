export type MergeableRecord = Record<string, unknown>;

function isObject(value: unknown): value is MergeableRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepMerge<T extends MergeableRecord, U extends MergeableRecord>(
  target: T,
  source: U
): T & U {
  const output: MergeableRecord = { ...target };

  for (const [key, value] of Object.entries(source)) {
    const existing = output[key];

    if (isObject(existing) && isObject(value)) {
      output[key] = deepMerge(existing, value);
      continue;
    }

    output[key] = value;
  }

  return output as T & U;
}

export default deepMerge;
