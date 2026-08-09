export type ParsedNumber = { valid: true; value: number } | { valid: false; value: null };
export type ParsedOptionalNumber = { valid: true; value: number | null } | { valid: false; value: null };

export function parseRequiredNumber(value: string, minimum: number, maximum: number): ParsedNumber {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum
    ? { valid: true, value: number }
    : { valid: false, value: null };
}

export function parseOptionalNonnegative(value: string): ParsedOptionalNumber {
  if (!value.trim()) return { valid: true, value: null };
  const number = Number(value);
  return Number.isFinite(number) && number >= 0
    ? { valid: true, value: number }
    : { valid: false, value: null };
}
