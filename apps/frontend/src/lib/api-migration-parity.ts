'use client';

export type NumericRecord = Record<string, number | undefined>;

export type ParityResult = {
  matches: boolean;
  mismatchKeys: string[];
};

export function compareNumericFields(
  local: NumericRecord,
  api: NumericRecord,
  fields: readonly string[],
): ParityResult {
  const mismatchKeys = fields.filter((field) => {
    const localValue = local[field] ?? 0;
    const apiValue = api[field] ?? 0;
    return localValue !== apiValue;
  });

  return {
    matches: mismatchKeys.length === 0,
    mismatchKeys,
  };
}
