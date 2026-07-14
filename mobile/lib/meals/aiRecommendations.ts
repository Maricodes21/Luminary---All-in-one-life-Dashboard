import type { CatalogRecipe } from './catalog';

export function resolveRankedRecipeIds(
  candidates: readonly CatalogRecipe[],
  value: unknown,
): CatalogRecipe[] {
  const byId = new Map(candidates.map((recipe) => [recipe.id, recipe]));
  const requested: string[] = [];
  visitStrings(value, (item) => {
    if (byId.has(item) && !requested.includes(item)) requested.push(item);
  });
  if (!requested.length) return [...candidates];
  return [
    ...requested.map((id) => byId.get(id)!),
    ...candidates.filter((recipe) => !requested.includes(recipe.id)),
  ];
}

function visitStrings(value: unknown, visit: (value: string) => void) {
  if (typeof value === 'string') {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => visitStrings(item, visit));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((item) => visitStrings(item, visit));
  }
}
