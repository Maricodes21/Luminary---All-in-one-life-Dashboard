import type { QueryInterpretation } from './types.ts';

const AMBIGUOUS_TERMS = new Set(['bar', 'drink', 'food', 'meal', 'shake', 'snack', 'something']);

export function isWeakOrAmbiguousQuery(query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase('en').replace(/\s+/g, ' ');
  if (normalized.length < 4) return true;
  const tokens = normalized.split(' ');
  return tokens.length === 1 && AMBIGUOUS_TERMS.has(tokens[0]);
}

export function sanitizeQueryInterpretation(
  value: unknown,
  allowedProviderIds: ReadonlySet<string>,
): QueryInterpretation {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const normalizedTerms = Array.isArray(record.normalizedTerms)
    ? record.normalizedTerms
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().replace(/\s+/g, ' '))
        .filter(Boolean)
        .slice(0, 4)
    : [];
  const providerIds = Array.isArray(record.providerIds)
    ? record.providerIds
        .filter((item): item is string => typeof item === 'string')
        .filter((item) => allowedProviderIds.has(item))
        .slice(0, 12)
    : [];

  return {
    normalizedTerms: [...new Set(normalizedTerms)],
    providerIds: [...new Set(providerIds)],
  };
}
