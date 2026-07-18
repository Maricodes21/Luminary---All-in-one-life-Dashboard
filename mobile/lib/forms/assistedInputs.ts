export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function stepNumber(value: number, step: number, direction: -1 | 1, min: number, max: number) {
  const precision = String(step).split('.')[1]?.length ?? 0;
  return Number(clampNumber(value + step * direction, min, max).toFixed(precision));
}

export function toLocalDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const isFutureDate = (value: string, today = toLocalDateValue(new Date())) => value > today;

export function uniqueChoices(values: string[]) {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    const clean = value.trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) return [];
    seen.add(key);
    return [clean];
  });
}

export function suggestFromHistory(query: string, values: string[], limit = 5) {
  const term = query.trim().toLowerCase();
  return uniqueChoices(values).filter((value) => !term || value.toLowerCase().includes(term)).slice(0, limit);
}
